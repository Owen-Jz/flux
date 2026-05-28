/**
 * Email diagnostic — probes each layer of the email pipeline and surfaces
 * the actual Resend response. Bypasses lib/email/resend.ts so silently-
 * swallowed errors become visible.
 *
 * Usage:
 *   npx tsx scripts/diagnose-email.ts                     # uses .env.local, default recipient
 *   npx tsx scripts/diagnose-email.ts you@example.com     # custom recipient
 *   ENV=production npx tsx scripts/diagnose-email.ts ...  # use .env.production
 */
import { Resend } from 'resend';
import { render } from '@react-email/components';
import dotenv from 'dotenv';
import { AuthOtpEmail } from '../components/emails/auth-otp';

const envFile = process.env.ENV === 'production' ? '.env.production' : '.env.local';
dotenv.config({ path: envFile });

const RECIPIENT = process.argv[2] || 'mnitta10@gmail.com';
const FROM = 'Flux Board <updates@mail.fluxboard.site>';
const REPLY_TO = 'updates@fluxboard.site';

function banner(title: string) {
    console.log('\n' + '='.repeat(70));
    console.log(`  ${title}`);
    console.log('='.repeat(70));
}

function ok(msg: string) { console.log(`  [OK]    ${msg}`); }
function fail(msg: string) { console.log(`  [FAIL]  ${msg}`); }
function info(msg: string) { console.log(`  [INFO]  ${msg}`); }

async function main() {
    banner(`Email pipeline diagnostic  (env=${envFile}  to=${RECIPIENT})`);

    // ── Layer 1: env presence ───────────────────────────────────────────────
    banner('Layer 1: environment');
    const key = process.env.RESEND_API_KEY;
    if (!key) {
        fail('RESEND_API_KEY is missing — sendEmail() returns silently in this state.');
        process.exit(1);
    }
    ok(`RESEND_API_KEY present (${key.length} chars, prefix=${key.slice(0, 3)}_)`);
    info(`FROM:     ${FROM}`);
    info(`replyTo:  ${REPLY_TO}`);

    const resend = new Resend(key);

    // ── Layer 2: API auth + domain verification ─────────────────────────────
    banner('Layer 2: Resend domain verification');
    try {
        const domainsRes = await resend.domains.list();
        if (domainsRes.error) {
            fail(`domains.list returned error: ${JSON.stringify(domainsRes.error)}`);
        } else {
            const list = domainsRes.data?.data || [];
            if (list.length === 0) {
                fail('No domains registered on this Resend account.');
            } else {
                ok(`Found ${list.length} domain(s):`);
                for (const d of list) {
                    const status = d.status;
                    const marker = status === 'verified' ? '[OK]   ' : '[BAD]  ';
                    console.log(`     ${marker} ${d.name.padEnd(35)} status=${status}  region=${d.region}`);
                }
                const fromDomain = FROM.match(/@([^>]+)>/)?.[1] || '';
                const match = list.find((d) => d.name.toLowerCase() === fromDomain.toLowerCase());
                if (!match) {
                    fail(`FROM domain "${fromDomain}" is NOT registered on this Resend account.`);
                    fail('This will make every send fail with a 403 validation error.');
                } else if (match.status !== 'verified') {
                    fail(`FROM domain "${fromDomain}" is registered but status="${match.status}", not "verified".`);
                    fail('Resend will reject every send until DNS records are verified.');
                } else {
                    ok(`FROM domain "${fromDomain}" is VERIFIED. Sends from this domain should be accepted.`);
                }
            }
        }
    } catch (err) {
        fail(`domains.list threw: ${err instanceof Error ? err.message : String(err)}`);
        info('This usually means the API key is invalid or revoked.');
    }

    // ── Layer 3: template render ────────────────────────────────────────────
    banner('Layer 3: AuthOtpEmail template render');
    let html = '';
    try {
        html = await render(AuthOtpEmail({ name: 'Diagnostic User', otp: '123456' }));
        ok(`Template rendered successfully (${html.length} bytes of HTML)`);
    } catch (err) {
        fail(`Template render threw: ${err instanceof Error ? err.message : String(err)}`);
        process.exit(1);
    }

    // ── Layer 4: live send via Resend (bypass sendEmail wrapper) ────────────
    banner('Layer 4: Live Resend send (bypassing sendEmail wrapper)');
    info(`Sending diagnostic OTP email to ${RECIPIENT} ...`);
    try {
        const sendRes = await resend.emails.send({
            from: FROM,
            replyTo: REPLY_TO,
            to: RECIPIENT,
            subject: '[DIAGNOSTIC] Flux email pipeline test',
            html,
        });
        if (sendRes.error) {
            fail('Resend returned an error:');
            console.log(JSON.stringify(sendRes.error, null, 2));
            console.log('\n  --- INTERPRETATION GUIDE ---');
            const errName = (sendRes.error as { name?: string }).name || '';
            const errMsg = (sendRes.error as { message?: string }).message || '';
            if (errName === 'validation_error' && /domain/i.test(errMsg)) {
                info('Diagnosis: FROM domain not verified for sending on this Resend account.');
                info('Fix: verify mail.fluxboard.site in Resend dashboard (Domains tab).');
            } else if (/api[_ ]?key|unauthorized|401|403/i.test(errName + errMsg)) {
                info('Diagnosis: API key rejected. Wrong account, revoked key, or restricted-permissions key.');
                info('Fix: regenerate the key in Resend and update the env var.');
            } else if (/suppress/i.test(errMsg)) {
                info(`Diagnosis: Recipient ${RECIPIENT} is on the Resend suppression list.`);
                info('Fix: remove from suppressions in Resend dashboard or test with a different recipient.');
            } else if (/rate[_ ]?limit/i.test(errName + errMsg)) {
                info('Diagnosis: Account/IP rate-limited by Resend.');
            } else {
                info('Diagnosis: unexpected error shape — read the JSON above for details.');
            }
        } else {
            ok(`Resend accepted the send. id=${sendRes.data?.id}`);
            info('Check the Resend dashboard Emails tab — if it shows "delivered", recipient-side filtering is the only remaining cause.');
            info('If it shows "bounced" or "complained", that recipient address is the issue (try a different one).');
        }
    } catch (err) {
        fail(`emails.send threw (network/SDK error): ${err instanceof Error ? err.message : String(err)}`);
    }

    banner('Diagnostic complete');
}

main().catch((err) => {
    console.error('\nDiagnostic crashed:', err);
    process.exit(1);
});
