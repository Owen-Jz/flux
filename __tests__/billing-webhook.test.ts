import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock verifyWebhookSignature
vi.mock('@/lib/paystack', () => ({
    verifyWebhookSignature: vi.fn(),
}));

// Mock connectDB
vi.mock('@/lib/db', () => ({
    connectDB: vi.fn().mockResolvedValue(undefined),
}));

// Mock models with factory functions
vi.mock('@/models/User', () => ({
    User: {
        findOne: vi.fn(),
    },
}));

vi.mock('@/models/ProcessedWebhook', () => ({
    ProcessedWebhook: {
        findOne: vi.fn(),
        create: vi.fn(),
    },
}));

vi.mock('@/models/FailedWebhook', () => ({
    FailedWebhook: {
        create: vi.fn(),
    },
}));

// Import after mocks
import { NextRequest } from 'next/server';
import { POST } from '../app/api/billing/webhook/route';
import { User } from '@/models/User';
import { ProcessedWebhook } from '@/models/ProcessedWebhook';
import { FailedWebhook } from '@/models/FailedWebhook';
import { verifyWebhookSignature } from '@/lib/paystack';

describe('Billing Webhook Handler', () => {
    const validPayload = {
        event: 'subscription.created',
        data: {
            id: 'evt_123456',
            customer: 'CUS_abc123',
            subscription: {
                subscription_code: 'SUB_xyz789',
            },
        },
    };

    const validPayloadString = JSON.stringify(validPayload);
    const validSignature = 'valid_signature_hash';

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(verifyWebhookSignature).mockReturnValue(true);
        vi.mocked(ProcessedWebhook.findOne).mockResolvedValue(null);
        vi.mocked(ProcessedWebhook.create).mockResolvedValue({ eventId: 'evt_123456' });
        vi.mocked(FailedWebhook.create).mockResolvedValue({});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    // Helper to create mock NextRequest
    function createMockRequest(payload: string, signature?: string): NextRequest {
        const headers = new Headers();
        if (signature) {
            headers.set('x-paystack-signature', signature);
        }
        return {
            text: vi.fn().mockResolvedValue(payload),
            headers,
        } as unknown as NextRequest;
    }

    describe('Signature Validation', () => {
        it('returns 400 when no signature header is present', async () => {
            const request = createMockRequest(validPayloadString); // No signature
            const response = await POST(request);
            const json = await response.json();

            expect(response.status).toBe(400);
            expect(json).toEqual({ error: 'No signature' });
        });

        it('returns 401 when signature is invalid', async () => {
            vi.mocked(verifyWebhookSignature).mockReturnValue(false);
            const request = createMockRequest(validPayloadString, 'invalid_signature');
            const response = await POST(request);
            const json = await response.json();

            expect(response.status).toBe(401);
            expect(json).toEqual({ error: 'Invalid signature' });
        });

        it('processes request when signature is valid', async () => {
            vi.mocked(User.findOne).mockResolvedValue({
                subscriptionId: undefined,
                subscriptionStatus: undefined,
                save: vi.fn(),
            } as any);
            const request = createMockRequest(validPayloadString, validSignature);
            const response = await POST(request);

            expect(response.status).toBe(200);
            expect(verifyWebhookSignature).toHaveBeenCalledWith(validPayloadString, validSignature);
        });
    });

    describe('Idempotency', () => {
        it('returns {received: true, duplicate: true} when event already processed', async () => {
            vi.mocked(ProcessedWebhook.findOne).mockResolvedValue({ eventId: 'evt_123456' } as any);
            const request = createMockRequest(validPayloadString, validSignature);
            const response = await POST(request);
            const json = await response.json();

            expect(response.status).toBe(200);
            expect(json).toEqual({ received: true, duplicate: true });
            expect(ProcessedWebhook.create).not.toHaveBeenCalled();
        });

        it('processes new events normally when not previously processed', async () => {
            vi.mocked(ProcessedWebhook.findOne).mockResolvedValue(null);
            vi.mocked(User.findOne).mockResolvedValue({
                subscriptionId: undefined,
                subscriptionStatus: undefined,
                save: vi.fn(),
            } as any);
            const request = createMockRequest(validPayloadString, validSignature);
            const response = await POST(request);

            expect(response.status).toBe(200);
            expect(ProcessedWebhook.create).toHaveBeenCalledWith({ eventId: 'evt_123456' });
        });
    });

    describe('Event Types', () => {
        describe('subscription.created', () => {
            it('sets subscriptionId and subscriptionStatus to active', async () => {
                const mockUser = {
                    subscriptionId: undefined,
                    subscriptionStatus: undefined,
                    save: vi.fn(),
                };
                vi.mocked(User.findOne).mockResolvedValue(mockUser as any);

                const payload = {
                    event: 'subscription.created',
                    data: {
                        id: 'evt_123',
                        customer: 'CUS_abc',
                        subscription: {
                            subscription_code: 'SUB_new',
                        },
                    },
                };
                const request = createMockRequest(JSON.stringify(payload), validSignature);
                await POST(request);

                expect(User.findOne).toHaveBeenCalledWith({ paystackCustomerCode: 'CUS_abc' });
                expect(mockUser.subscriptionId).toBe('SUB_new');
                expect(mockUser.subscriptionStatus).toBe('active');
                expect(mockUser.save).toHaveBeenCalled();
            });
        });

        describe('subscription.not_renewed', () => {
            it('sets subscriptionStatus to cancelled', async () => {
                const mockUser = {
                    subscriptionId: 'SUB_xyz',
                    subscriptionStatus: 'active',
                    save: vi.fn(),
                };
                vi.mocked(User.findOne).mockResolvedValue(mockUser as any);

                const payload = {
                    event: 'subscription.not_renewed',
                    data: {
                        subscription: {
                            subscription_code: 'SUB_xyz',
                        },
                    },
                };
                const request = createMockRequest(JSON.stringify(payload), validSignature);
                await POST(request);

                expect(User.findOne).toHaveBeenCalledWith({ subscriptionId: 'SUB_xyz' });
                expect(mockUser.subscriptionStatus).toBe('cancelled');
                expect(mockUser.save).toHaveBeenCalled();
            });
        });

        describe('subscription.disabled', () => {
            it('sets subscriptionStatus to inactive and plan to free', async () => {
                const mockUser = {
                    subscriptionId: 'SUB_xyz',
                    subscriptionStatus: 'active',
                    plan: 'pro',
                    save: vi.fn(),
                };
                vi.mocked(User.findOne).mockResolvedValue(mockUser as any);

                const payload = {
                    event: 'subscription.disabled',
                    data: {
                        subscription: {
                            subscription_code: 'SUB_xyz',
                        },
                    },
                };
                const request = createMockRequest(JSON.stringify(payload), validSignature);
                await POST(request);

                expect(User.findOne).toHaveBeenCalledWith({ subscriptionId: 'SUB_xyz' });
                expect(mockUser.subscriptionStatus).toBe('inactive');
                expect(mockUser.plan).toBe('free');
                expect(mockUser.save).toHaveBeenCalled();
            });
        });

        describe('charge.success', () => {
            it('sets subscriptionStatus to active', async () => {
                const mockUser = {
                    subscriptionId: undefined,
                    subscriptionStatus: 'past_due',
                    save: vi.fn(),
                };
                vi.mocked(User.findOne).mockResolvedValue(mockUser as any);

                const payload = {
                    event: 'charge.success',
                    data: {
                        customer: 'CUS_customer',
                        amount: 50000,
                        reference: 'REF_new',
                    },
                };
                const request = createMockRequest(JSON.stringify(payload), validSignature);
                await POST(request);

                expect(User.findOne).toHaveBeenCalledWith({ paystackCustomerCode: 'CUS_customer' });
                expect(mockUser.subscriptionStatus).toBe('active');
                expect(mockUser.subscriptionId).toBe('REF_new');
                expect(mockUser.save).toHaveBeenCalled();
            });

            it('does not change subscriptionStatus if already active', async () => {
                const mockUser = {
                    subscriptionId: 'SUB_existing',
                    subscriptionStatus: 'active',
                    save: vi.fn(),
                };
                vi.mocked(User.findOne).mockResolvedValue(mockUser as any);

                const payload = {
                    event: 'charge.success',
                    data: {
                        customer: 'CUS_customer',
                        amount: 50000,
                        reference: 'REF_new',
                    },
                };
                const request = createMockRequest(JSON.stringify(payload), validSignature);
                await POST(request);

                expect(mockUser.subscriptionStatus).toBe('active');
                expect(mockUser.save).toHaveBeenCalled();
            });
        });

        describe('invoice.payment_failed', () => {
            it('sets subscriptionStatus to past_due', async () => {
                const mockUser = {
                    subscriptionId: 'SUB_xyz',
                    subscriptionStatus: 'active',
                    save: vi.fn(),
                };
                vi.mocked(User.findOne).mockResolvedValue(mockUser as any);

                const payload = {
                    event: 'invoice.payment_failed',
                    data: {
                        customer: 'CUS_customer',
                    },
                };
                const request = createMockRequest(JSON.stringify(payload), validSignature);
                await POST(request);

                expect(User.findOne).toHaveBeenCalledWith({ paystackCustomerCode: 'CUS_customer' });
                expect(mockUser.subscriptionStatus).toBe('past_due');
                expect(mockUser.save).toHaveBeenCalled();
            });
        });
    });

    describe('Error Handling', () => {
        it('stores failed events in FailedWebhook dead letter queue', async () => {
            const mockSave = vi.fn().mockRejectedValue(new Error('Database error'));
            vi.mocked(User.findOne).mockResolvedValue({
                subscriptionId: undefined,
                subscriptionStatus: undefined,
                save: mockSave,
            } as any);

            const payload = {
                event: 'subscription.created',
                data: {
                    id: 'evt_fail',
                    customer: 'CUS_fail',
                    subscription: {
                        subscription_code: 'SUB_fail',
                    },
                },
            };
            const request = createMockRequest(JSON.stringify(payload), validSignature);
            const response = await POST(request);
            const json = await response.json();

            expect(response.status).toBe(500);
            expect(FailedWebhook.create).toHaveBeenCalledWith({
                eventType: 'subscription.created',
                payload: expect.objectContaining({
                    event: 'subscription.created',
                    data: expect.objectContaining({ id: 'evt_fail' }),
                }),
                error: 'Database error',
            });
        });

        it('returns 500 with error message on failure', async () => {
            const mockSave = vi.fn().mockRejectedValue(new Error('Save failed'));
            vi.mocked(User.findOne).mockResolvedValue({
                subscriptionId: undefined,
                subscriptionStatus: undefined,
                save: mockSave,
            } as any);

            const payload = {
                event: 'subscription.created',
                data: {
                    id: 'evt_error',
                    customer: 'CUS_error',
                    subscription: {
                        subscription_code: 'SUB_error',
                    },
                },
            };
            const request = createMockRequest(JSON.stringify(payload), validSignature);
            const response = await POST(request);
            const json = await response.json();

            expect(response.status).toBe(500);
            expect(json.error).toBe('Save failed');
        });

        it('handles case when no user found for event', async () => {
            vi.mocked(User.findOne).mockResolvedValue(null);

            const payload = {
                event: 'subscription.created',
                data: {
                    id: 'evt_nouser',
                    customer: 'CUS_nouser',
                    subscription: {
                        subscription_code: 'SUB_nouser',
                    },
                },
            };
            const request = createMockRequest(JSON.stringify(payload), validSignature);
            const response = await POST(request);

            expect(response.status).toBe(200);
            // User.findOne was called but no user.save since no user found
            expect(User.findOne).toHaveBeenCalled();
        });
    });
});
