import { useCallback, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Checkbox,
  FileInput,
  FileInputItem,
  ProgressBar,
  Rows,
  Text,
  Title,
} from "@canva/app-ui-kit";
import { extractPdfLayers } from "./pdf/extract";
import type { PageLayers } from "./pdf/extract";
import { importPagesAsLayers } from "./canva/insert";
import type { ImportOptions } from "./canva/insert";
import { FREE_PAGE_LIMIT, isPro, openUpgradePage } from "./premium";

type Phase =
  | { name: "idle" }
  | { name: "parsing"; progress: number }
  | { name: "ready" }
  | { name: "importing"; progress: number }
  | { name: "done" }
  | { name: "error"; message: string };

export function App() {
  const [phase, setPhase] = useState<Phase>({ name: "idle" });
  const [fileName, setFileName] = useState<string | null>(null);
  const [pages, setPages] = useState<PageLayers[]>([]);
  const [options, setOptions] = useState<ImportOptions>({
    includeBackground: true,
    includeImages: true,
    includeText: true,
  });

  const handleFile = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setFileName(file.name);
    setPages([]);
    setPhase({ name: "parsing", progress: 0 });
    try {
      const buffer = await file.arrayBuffer();
      const extracted = await extractPdfLayers(buffer, (done, total) =>
        setPhase({ name: "parsing", progress: Math.round((done / total) * 100) })
      );
      setPages(extracted);
      setPhase({ name: "ready" });
    } catch (error) {
      setPhase({
        name: "error",
        message:
          error instanceof Error && error.message
            ? `Couldn't read this PDF: ${error.message}`
            : "Couldn't read this PDF. It may be corrupted or password protected.",
      });
    }
  }, []);

  const handleImport = useCallback(async () => {
    const pagesToImport = isPro() ? pages : pages.slice(0, FREE_PAGE_LIMIT);
    setPhase({ name: "importing", progress: 0 });
    try {
      await importPagesAsLayers(pagesToImport, options, (done, total) =>
        setPhase({ name: "importing", progress: Math.round((done / total) * 100) })
      );
      setPhase({ name: "done" });
    } catch (error) {
      setPhase({
        name: "error",
        message:
          error instanceof Error && error.message
            ? `Import failed: ${error.message}`
            : "Import failed. Please try again.",
      });
    }
  }, [pages, options]);

  const busy = phase.name === "parsing" || phase.name === "importing";
  const gated = !isPro() && pages.length > FREE_PAGE_LIMIT;
  const textCount = pages.reduce((n, p) => n + p.texts.length, 0);
  const imageCount = pages.reduce((n, p) => n + p.images.length, 0);

  return (
    <Rows spacing="2u">
      <Rows spacing="1u">
        <Title size="small">PDF to editable layers</Title>
        <Text size="small" tone="tertiary">
          Upload a PDF and add each page to your design as separate, editable
          elements: a background, images, and real text you can restyle.
        </Text>
      </Rows>

      <Rows spacing="1u">
        <FileInput
          accept={["application/pdf", ".pdf"]}
          disabled={busy}
          stretchButton
          onDropAcceptedFiles={handleFile}
        />
        {fileName ? (
          <FileInputItem
            label={fileName}
            onDeleteClick={() => {
              setFileName(null);
              setPages([]);
              setPhase({ name: "idle" });
            }}
          />
        ) : null}
      </Rows>

      {phase.name === "parsing" ? (
        <Rows spacing="1u">
          <Text size="small">Separating layers…</Text>
          <ProgressBar value={phase.progress} />
        </Rows>
      ) : null}

      {pages.length > 0 && phase.name !== "parsing" ? (
        <Rows spacing="1u">
          <Rows spacing="0.5u">
            <Badge
              text={`${pages.length} page${pages.length === 1 ? "" : "s"}`}
              tone="info"
            />
            <Text size="small" tone="tertiary">
              Found {textCount} text element{textCount === 1 ? "" : "s"} and{" "}
              {imageCount} image{imageCount === 1 ? "" : "s"}.
            </Text>
          </Rows>

          <Checkbox
            label="Background layer"
            checked={options.includeBackground}
            disabled={busy}
            onChange={(_, checked) =>
              setOptions((o) => ({ ...o, includeBackground: checked }))
            }
          />
          <Checkbox
            label="Image layers"
            checked={options.includeImages}
            disabled={busy}
            onChange={(_, checked) =>
              setOptions((o) => ({ ...o, includeImages: checked }))
            }
          />
          <Checkbox
            label="Editable text layers"
            checked={options.includeText}
            disabled={busy}
            onChange={(_, checked) =>
              setOptions((o) => ({ ...o, includeText: checked }))
            }
          />

          {gated ? (
            <Alert tone="info">
              Free plan imports the first {FREE_PAGE_LIMIT} pages. Upgrade to
              import all {pages.length} pages.
            </Alert>
          ) : null}

          <Button
            variant="primary"
            stretch
            loading={phase.name === "importing"}
            disabled={
              busy ||
              (!options.includeBackground &&
                !options.includeImages &&
                !options.includeText)
            }
            onClick={handleImport}
          >
            {gated
              ? `Add first ${FREE_PAGE_LIMIT} pages to design`
              : `Add ${pages.length} page${pages.length === 1 ? "" : "s"} to design`}
          </Button>

          {gated ? (
            <Button variant="secondary" stretch onClick={() => openUpgradePage()}>
              Upgrade to Pro
            </Button>
          ) : null}
        </Rows>
      ) : null}

      {phase.name === "importing" ? (
        <Rows spacing="1u">
          <Text size="small">
            Adding pages to your design… this can take a moment per page.
          </Text>
          <ProgressBar value={phase.progress} />
        </Rows>
      ) : null}

      {phase.name === "done" ? (
        <Alert tone="positive">
          Done! Each PDF page was added as a new page with editable layers.
        </Alert>
      ) : null}

      {phase.name === "error" ? <Alert tone="critical">{phase.message}</Alert> : null}
    </Rows>
  );
}
