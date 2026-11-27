/** A small notebook that covers every kind of cell and output the renderer supports. */
const PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

const code = (source: string, outputs: unknown[] = [], execution_count: number | null = 1) => ({
  cell_type: 'code',
  metadata: {},
  source: [source],
  execution_count,
  outputs,
});

const markdown = (source: string, extra: object = {}) => ({
  cell_type: 'markdown',
  metadata: {},
  source: source.split(/(?<=\n)/),
  ...extra,
});

export const sample = {
  nbformat: 4,
  nbformat_minor: 5,
  metadata: { language_info: { name: 'python' } },
  cells: [
    {
      cell_type: 'markdown',
      metadata: { id: 'view-in-github', colab_type: 'text' },
      source: ['<a href="https://colab.research.google.com/x">badge</a>'],
    },
    markdown('# Intro\n\nInline $a_1 * b_1 = c_1$ and $5 or $10.\n\n$$\n\\sum_{i=1}^n x_i\n$$\n'),
    markdown('## Setup\n\n`$not math$`\n\n| a | b |\n|---|---|\n| 1 | 2 |\n'),
    markdown('## Setup\n\n\\begin{align}\nx &= 1 \\\\\ny &= 2\n\\end{align}\n'),
    markdown(
      'Bad <script>alert(1)</script><img src="x" onerror="alert(1)"> [x](javascript:alert(1))',
    ),
    markdown('![plot](attachment:p.png)', { attachments: { 'p.png': { 'image/png': PNG } } }),
    code('import numpy as np\nprint("hi")', [
      { output_type: 'stream', name: 'stdout', text: ['hi\n'] },
    ]),
    code('train()', [
      {
        output_type: 'stream',
        name: 'stdout',
        text: [Array.from({ length: 200 }, (_, i) => `epoch ${i}`).join('\n')],
      },
      { output_type: 'stream', name: 'stderr', text: ['  10%\r  50%\r 100%\n'] },
    ]),
    code('df.head()', [
      {
        output_type: 'execute_result',
        data: {
          'text/html': [
            '<style>td{color:red}</style><table border="1" onclick="x()"><tr><th>col</th></tr><tr><td>1</td></tr></table>',
          ],
          'text/plain': ['   col\n0  1'],
        },
      },
    ]),
    code('plt.plot()', [
      { output_type: 'display_data', data: { 'image/png': PNG, 'text/plain': ['<Figure 1x1>'] } },
    ]),
    code('fig.show()', [
      {
        output_type: 'display_data',
        data: { 'text/html': '<script>Plotly()</script>', 'text/plain': 'Figure()' },
      },
    ]),
    code('import d2l', [
      {
        output_type: 'error',
        ename: 'ModuleNotFoundError',
        evalue: "No module named 'd2l'",
        traceback: ['\u001b[0;31mModuleNotFoundError\u001b[0m: No module'],
      },
    ]),
    code('', []),
  ],
};
