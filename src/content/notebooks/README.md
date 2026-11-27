# Adding a notebook

1. Put `my-notebook.ipynb` in this folder.
2. Add `my-notebook.meta.yaml` next to it:

```yaml
title: My notebook
date: 2026-11-24
topic: Deep Learning
summary: One sentence about what this notebook covers.
tags: [rnn]
colabUrl: https://colab.research.google.com/... # optional
repoUrl: https://github.com/... # optional
```

Both files are required. The build fails with a clear message if one is missing.
