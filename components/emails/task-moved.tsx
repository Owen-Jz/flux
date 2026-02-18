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

interface TaskMovedEmailProps {
  taskTitle: string;
  moverName: string;
  fromStatus: string;
  toStatus: string;
  taskUrl: string;
  workspaceName: string;
}

export const TaskMovedEmail = ({
  taskTitle,
  moverName,
  fromStatus,
  toStatus,
  taskUrl,
  workspaceName,
}: TaskMovedEmailProps) => {
  const getStatusColor = (status: string) => {
    const s = status.toUpperCase();
    if (s.includes('DONE')) return 'text-green-600';
    if (s.includes('PROGRESS')) return 'text-blue-600';
    return 'text-gray-600';
  };

  return (
    <Html>
      <Head />
      <Preview>Task Update: {taskTitle}</Preview>
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
              <strong>{moverName}</strong> moved <strong>{taskTitle}</strong> in {workspaceName}.
            </Text>
            
            <Section className="bg-surface p-4 rounded-lg border border-solid border-[#e2e8f0] my-4 text-center">
               <Text className="m-0 font-bold text-lg">
                 <span className="text-gray-500 line-through mr-2">{fromStatus}</span> 
                 <span className="text-gray-400 mx-2">→</span>
                 <span className={getStatusColor(toStatus)}>{toStatus}</span>
               </Text>
            </Section>

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
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};
