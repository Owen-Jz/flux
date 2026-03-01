import { TaskMovedEmail } from '../components/emails/task-moved';
import { render } from '@react-email/components';

async function main() {
    try {
        const html = await render(
            TaskMovedEmail({
                taskTitle: 'Fix the board',
                moverName: 'Owen',
                fromStatus: 'BACKLOG',
                toStatus: 'DONE',
                workspaceName: 'Dev Workspace',
                taskUrl: 'https://www.fluxboard.site/dev/board/main',
            })
        );
        console.log('Successfully rendered HTML (length):', html.length);
    } catch (err) {
        console.error('FAILED TO RENDER: ', err);
    }
}
main();
