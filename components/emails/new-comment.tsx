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

interface NewCommentEmailProps {
  taskTitle: string;
  commenterName: string;
  commentContent: string;
  taskUrl: string;
}

export const NewCommentEmail = ({
  taskTitle,
  commenterName,
  commentContent,
  taskUrl,
}: NewCommentEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>New Comment on {taskTitle}</Preview>
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
              <strong>{commenterName}</strong> commented on <strong>{taskTitle}</strong>:
            </Text>
            
            <Section className="bg-surface p-4 rounded-lg border border-solid border-[#e2e8f0] my-4">
               <Text className="m-0 text-gray-700 italic">"{commentContent}"</Text>
            </Section>

            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-brand rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                href={taskUrl}
              >
                Reply
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
