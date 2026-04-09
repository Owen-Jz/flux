import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Link,
    Preview,
    Section,
    Text,
    Tailwind,
} from "@react-email/components";
import * as React from "react";

interface TaskCreatedEmailProps {
    taskTitle: string;
    creatorName: string;
    workspaceName: string;
    taskUrl: string;
}

export const TaskCreatedEmail = ({
    taskTitle,
    creatorName,
    workspaceName,
    taskUrl,
}: TaskCreatedEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>New Task: {taskTitle}</Preview>
            <Tailwind
                config={{
                    theme: {
                        extend: {
                            colors: {
                                brand: "#4f46e5",
                                surface: "#f8fafc",
                            },
                        },
                    },
                }}
            >
                <Body className="bg-white my-auto mx-auto font-sans">
                    <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] w-[465px]">
                        <Section className="mt-[32px]">
                            <Heading className="text-black text-[24px] font-bold text-center p-0 my-[30px] mx-0">
                                Flux
                            </Heading>
                        </Section>
                        <Text className="text-black text-[14px] leading-[24px]">
                            <strong>{creatorName}</strong> created a new task <strong>{taskTitle}</strong> in {workspaceName}.
                        </Text>

                        <Section className="text-center mt-[32px] mb-[32px]">
                            <Button
                                className="bg-brand rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                                href={taskUrl}
                            >
                                View Board
                            </Button>
                        </Section>
                        <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
                        <Text className="text-[#666666] text-[12px] leading-[24px]">
                            Flux Board Notifications
                        </Text>
                        <Section className="text-center mt-[20px]">
                            <Link href={`${process.env.APP_URL || "https://flux.app"}/unsubscribe`} className="text-[#999999] text-[11px] no-underline mx-2">
                                Unsubscribe
                            </Link>
                            <Link href={`${process.env.APP_URL || "https://flux.app"}/privacy`} className="text-[#999999] text-[11px] no-underline mx-2">
                                Privacy Policy
                            </Link>
                            <Link href={`${process.env.APP_URL || "https://flux.app"}/terms`} className="text-[#999999] text-[11px] no-underline mx-2">
                                Terms of Service
                            </Link>
                        </Section>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};
