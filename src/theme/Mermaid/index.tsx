import React, {type ReactNode} from 'react';
import Mermaid from '@theme-original/Mermaid';
import type MermaidType from '@theme/Mermaid';
import type {WrapperProps} from '@docusaurus/types';
import {useColorMode} from '@docusaurus/theme-common';

type Props = WrapperProps<typeof MermaidType>;

// The stock component re-renders under the same element id when the colour mode
// resolves after hydration, and Mermaid deletes the existing element with that id
// first, which can blank a diagram. Remounting per colour mode gives each render
// its own id.
export default function MermaidWrapper(props: Props): ReactNode {
  const {colorMode} = useColorMode();
  return <Mermaid key={colorMode} {...props} />;
}
