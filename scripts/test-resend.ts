import { TaskMovedEmail } from '../components/emails/task-moved';
import { render } from '@react-email/components';
import { sendEmail } from '../lib/email/resend';
import fs from 'fs';
import path from 'path';

async function test() {
    try {
        const html = await render(
            TaskMovedEmail({
                taskTitle: 'Important task',
                moverName: 'Owen',
                fromStatus: 'BACKLOG',
                toStatus: 'DONE',
                workspaceName: 'Dev workspace',
                taskUrl: 'http://localhost:3000/dev/board/main',
            })
        );
        fs.writeFileSync(path.join(process.cwd(), 'render_output.txt'), 'RENDER SUCCESS: ' + html.length);

        // Try sending an email just to see if resend fails
        await sendEmail({
            to: 'owendigitals@gmail.com',
            subject: 'Test email from flux',
            html,
        });

        fs.appendFileSync(path.join(process.cwd(), 'render_output.txt'), '\nSEND REQUEST COMPLETED');
    } catch (err: any) {
        fs.writeFileSync(path.join(process.cwd(), 'render_output.txt'), 'ERROR: ' + err.stack);
    }
}
test();
