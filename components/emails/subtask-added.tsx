import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Preview,
    Section,
    Text,
    Tailwind,
} from "@react-email/components";
import * as React from "react";

interface SubtaskAddedEmailProps {
    taskTitle: string;
    subtaskTitles: string[];
    creatorName: string;
    workspaceName: string;
    taskUrl: string;
}

export const SubtaskAddedEmail = ({
    taskTitle,
    subtaskTitles,
    creatorName,
    workspaceName,
    taskUrl,
}: SubtaskAddedEmailProps) => {
    const subtaskList = subtaskTitles.length > 0
        ? subtaskTitles.map(title => `• ${title}`).join('\n')
        : '';

    return (
        <Html>
            <Head />
            <Preview>New Subtasks Added to: {taskTitle}</Preview>
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
                            <strong>{creatorName}</strong> added {subtaskTitles.length === 1 ? 'a new subtask' : `${subtaskTitles.length} new subtasks`} to <strong>{taskTitle}</strong> in {workspaceName}.
                        </Text>

                        {subtaskTitles.length > 0 && (
                            <Section className="bg-surface rounded p-[16px] mt-[16px] mb-[16px]">
                                <Text className="text-black text-[14px] leading-[24px] font-semibold mb-[8px]">
                                    New Subtasks:
                                </Text>
                                <Text className="text-black text-[14px] leading-[24px] whitespace-pre-line">
                                    {subtaskList}
                                </Text>
                            </Section>
                        )}

                        <Section className="text-center mt-[32px] mb-[32px]">
                            <Button
                                className="bg-brand rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                                href={taskUrl}
                            >
                                View Task
                            </Button>
                        </Section>
                        <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
                        <Text className="text-[#666666] text-[12px] leading-[24px]">
                            Flux Board Notifications
                        </Text>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};