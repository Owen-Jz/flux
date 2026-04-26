import { Composition } from 'remotion';
import { TaskProgress, defaultProps } from './TaskProgress';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="TaskProgress"
        component={TaskProgress}
        durationInFrames={150}
        fps={30}
        width={800}
        height={600}
        defaultProps={defaultProps}
      />
    </>
  );
};
