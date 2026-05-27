// SPDX-License-Identifier: EPL-2.0
// headlamp_tekton/src/pages/RawJSONViewer.tsx

import { useState } from 'react';
import { Editor } from '@monaco-editor/react';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';

type Props = {
  data: any;
  maxHeight?: number;
  minHeight?: number;
};

export function RawJsonViewer({
  data,
  maxHeight = 400,
  minHeight = 120,
}: Props) {
  const theme = useTheme();
  const [height, setHeight] = useState(minHeight);

  const value = JSON.stringify(data ?? {}, null, 2);

  return (
    <Box
      sx={{
        width: '100%',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      <Editor
        value={value}
        language="json"
        height={Math.min(Math.max(height, minHeight), maxHeight)}
        theme={theme.palette.mode === 'dark' ? 'vs-dark' : 'light'}
        onMount={editor => {
          const updateHeight = () => {
            const contentHeight = editor.getContentHeight();
            setHeight(contentHeight);
          };

          updateHeight();
          editor.onDidContentSizeChange(updateHeight);
        }}
        options={{
          readOnly: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          fontSize: 12,
        }}
      />
    </Box>
  );
}
