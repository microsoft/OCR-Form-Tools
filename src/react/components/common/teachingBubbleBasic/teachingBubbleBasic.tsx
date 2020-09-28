import * as React from 'react';
import { IButtonProps } from 'office-ui-fabric-react/lib/Button';
import { TeachingBubble } from 'office-ui-fabric-react/lib/TeachingBubble';

export interface ITeachingBubbleBasicProps {
    message: string;
    onDismiss: (...params: any[]) => void;
    onClick: (...params: any[]) => void;
    primary: string;
    secondary: string;
    target: string;
    headline: string;
}


export const TeachingBubbleBasic = (props: ITeachingBubbleBasicProps) => {
  const exampleSecondaryButtonProps: IButtonProps = {
    children: props.secondary,
    onClick: props.onDismiss,
  }

  const examplePrimaryButtonProps: IButtonProps = {
    children: props.primary,
    onClick: () => {
      props.onClick();
      props.onDismiss();
    }
  };

  return (
    <div>
        <TeachingBubble
          headline={props.headline}
          isWide={true}
          target={props.target}
          primaryButtonProps={examplePrimaryButtonProps}
          secondaryButtonProps={exampleSecondaryButtonProps}
          onDismiss={props.onDismiss}
        >
            {props.message}
        </TeachingBubble>
      )
    </div>
  );
};
