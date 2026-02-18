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

interface IssueCreatedEmailProps {
  workspaceName: string;
  issueTitle: string;
  issueType: string;
  reporterName: string;
  issueUrl: string;
}

export const IssueCreatedEmail = ({
  workspaceName,
  issueTitle,
  issueType,
  reporterName,
  issueUrl,
}: IssueCreatedEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>New Issue: {issueTitle}</Preview>
      <Tailwind
        config={{
          theme: {
            extend: {
              colors: {
                brand: "#4f46e5",
                surface: "#f8fafc",
                text: "#0f172a",
                bug: "#ef4444",
                feature: "#f59e0b",
                improvement: "#3b82f6",
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
              <strong>{reporterName}</strong> opened a new 
              <span className={issueType === 'BUG' ? 'text-bug' : issueType === 'FEATURE' ? 'text-feature' : 'text-improvement'}> {issueType} </span> 
              in <strong>{workspaceName}</strong>.
            </Text>
            
            <Section className="bg-surface p-4 rounded-lg border border-solid border-[#e2e8f0] my-4">
               <Text className="m-0 font-bold text-lg">{issueTitle}</Text>
            </Section>

            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-brand rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                href={issueUrl}
              >
                View Issue
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
