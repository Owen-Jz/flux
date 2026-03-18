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

interface TaskOverdueEmailProps {
  recipientName: string;
  taskTitle: string;
  workspaceName: string;
  boardName: string;
  taskUrl: string;
  dueDate: string;
}

export const TaskOverdueEmail = ({
  recipientName,
  taskTitle,
  workspaceName,
  boardName,
  taskUrl,
  dueDate,
}: TaskOverdueEmailProps) => {
  const formattedDueDate = new Date(dueDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Html>
      <Head />
      <Preview>Task Overdue: {taskTitle}</Preview>
      <Tailwind
        config={{
          theme: {
            extend: {
              colors: {
                brand: "#4f46e5",
                surface: "#f8fafc",
                text: "#0f172a",
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
              Hello <strong>{recipientName}</strong>,
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              This is a reminder that the following task is <strong>overdue</strong>:
            </Text>

            <Section className="bg-surface p-4 rounded-lg border border-solid border-[#e2e8f0] my-4">
              <Text className="m-0 font-bold text-lg">{taskTitle}</Text>
              <Text className="m-0 text-sm text-red-600 mt-2">
                Due date: {formattedDueDate}
              </Text>
              <Text className="m-0 text-sm text-gray-500 mt-1">
                Board: {boardName} | Workspace: {workspaceName}
              </Text>
            </Section>

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
              This is an automated notification from Flux Board.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};
