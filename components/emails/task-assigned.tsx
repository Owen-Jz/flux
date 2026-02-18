import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Tailwind,
} from "@react-email/components";
import * as React from "react";

interface TaskAssignedEmailProps {
  assigneeName: string;
  taskTitle: string;
  workspaceName: string;
  taskUrl: string;
  assignerName: string;
}

export const TaskAssignedEmail = ({
  assigneeName,
  taskTitle,
  workspaceName,
  taskUrl,
  assignerName,
}: TaskAssignedEmailProps) => {
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
              Hello <strong>{assigneeName}</strong>,
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              <strong>{assignerName}</strong> has assigned you to a new task in <strong>{workspaceName}</strong>.
            </Text>
            
            <Section className="bg-surface p-4 rounded-lg border border-solid border-[#e2e8f0] my-4">
               <Text className="m-0 font-bold text-lg">{taskTitle}</Text>
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
