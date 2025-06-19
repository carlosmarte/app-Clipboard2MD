import React, { useState, useCallback, useRef, useEffect } from "react";

// Custom implementation of react-resizable-panels API
const PanelGroup = ({
  children,
  direction = "horizontal",
  onLayout,
  autoSaveId,
  ...props
}) => {
  const [sizes, setSizes] = useState([50, 50]);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);
  const autoSaveKey = autoSaveId
    ? `react-resizable-panels:${autoSaveId}`
    : null;

  // Load saved layout on mount
  useEffect(() => {
    if (autoSaveKey) {
      try {
        const saved = localStorage.getItem(autoSaveKey);
        if (saved) {
          const parsedSizes = JSON.parse(saved);
          setSizes(parsedSizes);
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }
  }, [autoSaveKey]);

  // Save layout when sizes change
  useEffect(() => {
    if (autoSaveKey && sizes.length > 0) {
      localStorage.setItem(autoSaveKey, JSON.stringify(sizes));
    }
    if (onLayout) {
      onLayout(sizes);
    }
  }, [sizes, autoSaveKey, onLayout]);

  const handleMouseDown = useCallback((e) => {
    setIsDragging(true);
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging || !containerRef.current) return;

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();

      if (direction === "horizontal") {
        const newLeftSize = ((e.clientX - rect.left) / rect.width) * 100;
        const constrainedSize = Math.max(10, Math.min(90, newLeftSize));
        setSizes([constrainedSize, 100 - constrainedSize]);
      } else {
        const newTopSize = ((e.clientY - rect.top) / rect.height) * 100;
        const constrainedSize = Math.max(10, Math.min(90, newTopSize));
        setSizes([constrainedSize, 100 - constrainedSize]);
      }
    },
    [isDragging, direction]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const panelChildren = [];
  const handleChildren = [];

  React.Children.forEach(children, (child, index) => {
    if (child?.type === Panel) {
      panelChildren.push(
        React.cloneElement(child, {
          key: `panel-${index}`,
          _size: sizes[panelChildren.length] || child.props.defaultSize || 50,
        })
      );
    } else if (child?.type === PanelResizeHandle) {
      handleChildren.push(
        React.cloneElement(child, {
          key: `handle-${index}`,
          _onMouseDown: handleMouseDown,
          _isDragging: isDragging,
        })
      );
    }
  });

  const flexDirection = direction === "horizontal" ? "row" : "column";

  return (
    <div
      ref={containerRef}
      style={{
        display: "flex",
        flexDirection,
        height: "100%",
        width: "100%",
        cursor: isDragging
          ? direction === "horizontal"
            ? "col-resize"
            : "row-resize"
          : "default",
        ...props.style,
      }}
      {...props}
    >
      {panelChildren.map((panel, index) => (
        <React.Fragment key={`fragment-${index}`}>
          {panel}
          {handleChildren[index]}
        </React.Fragment>
      ))}
    </div>
  );
};

const Panel = ({
  children,
  defaultSize = 50,
  minSize = 10,
  maxSize = 90,
  _size,
  id,
  ...props
}) => {
  const size = _size !== undefined ? _size : defaultSize;

  return (
    <div
      id={id}
      style={{
        flex: `0 0 ${size}%`,
        overflow: "hidden",
        ...props.style,
      }}
      {...props}
    >
      {children}
    </div>
  );
};

const PanelResizeHandle = ({
  className,
  _onMouseDown,
  _isDragging,
  id,
  ...props
}) => {
  return (
    <div
      id={id}
      className={className}
      style={{
        flexShrink: 0,
        width: "4px",
        backgroundColor: _isDragging ? "#0366d6" : "#e1e4e8",
        cursor: "col-resize",
        borderLeft: "1px solid #d0d7de",
        borderRight: "1px solid #d0d7de",
        transition: _isDragging ? "none" : "background-color 0.2s",
        ...props.style,
      }}
      onMouseDown={_onMouseDown}
      onMouseEnter={(e) =>
        !_isDragging && (e.target.style.backgroundColor = "#0366d6")
      }
      onMouseLeave={(e) =>
        !_isDragging && (e.target.style.backgroundColor = "#e1e4e8")
      }
      {...props}
    />
  );
};

// Helper functions (matching react-resizable-panels API)
const getPanelElement = (id) => document.getElementById(id);
const getPanelGroupElement = (id) => document.getElementById(id);
const getResizeHandleElement = (id) => document.getElementById(id);

// Custom HTML to Markdown converter
class CustomMarkdownConverter {
  constructor(options = {}) {
    this.options = {
      headingStyle: "atx",
      bulletListMarker: "-",
      codeBlockStyle: "fenced",
      fence: "```",
      emDelimiter: "*",
      strongDelimiter: "**",
      linkStyle: "inlined",
      ...options,
    };
  }

  convert(html) {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    this.cleanupRenderedMarkdown(tempDiv);
    return this.processNode(tempDiv).trim();
  }

  cleanupRenderedMarkdown(element) {
    // Remove Apple-converted-space spans
    const appleSpaces = element.querySelectorAll(
      ".Apple-converted-space, span.Apple-converted-space"
    );
    appleSpaces.forEach((span) => {
      span.replaceWith(" ");
    });

    // Remove common Apple classes but keep content
    const appleElements = element.querySelectorAll(
      ".s1, .s2, .s3, .s4, .s5, .p1, .p2, .p3, .p4, .p5"
    );
    appleElements.forEach((el) => {
      while (el.firstChild) {
        el.parentNode.insertBefore(el.firstChild, el);
      }
      el.remove();
    });

    // Remove style attributes and meta tags
    element
      .querySelectorAll("[style]")
      .forEach((el) => el.removeAttribute("style"));
    element.querySelectorAll("meta, head").forEach((el) => el.remove());
  }

  processNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return "";
    }

    const tagName = node.tagName.toLowerCase();
    const content = Array.from(node.childNodes)
      .map((child) => this.processNode(child))
      .join("");

    switch (tagName) {
      case "h1":
        return `# ${content.trim()}\n\n`;
      case "h2":
        return `## ${content.trim()}\n\n`;
      case "h3":
        return `### ${content.trim()}\n\n`;
      case "h4":
        return `#### ${content.trim()}\n\n`;
      case "h5":
        return `##### ${content.trim()}\n\n`;
      case "h6":
        return `###### ${content.trim()}\n\n`;

      case "p":
        if (node.closest("td") || node.closest("th")) {
          return content.trim();
        }
        return content.trim() ? `${content.trim()}\n\n` : "";

      case "strong":
      case "b":
        return `**${content}**`;
      case "em":
      case "i":
        return `*${content}*`;
      case "a":
        const href = node.getAttribute("href");
        return href ? `[${content}](${href})` : content;
      case "code":
        return `\`${content}\``;
      case "pre":
        return `\n\`\`\`\n${content}\n\`\`\`\n\n`;
      case "ul":
        return `${content}\n`;
      case "ol":
        return `${content}\n`;
      case "li":
        const listParent = node.parentElement;
        const isOrdered =
          listParent && listParent.tagName.toLowerCase() === "ol";
        const marker = isOrdered ? "1. " : "- ";
        return `${marker}${content.trim()}\n`;
      case "blockquote":
        return (
          content
            .split("\n")
            .map((line) => `> ${line}`)
            .join("\n") + "\n\n"
        );
      case "table":
        return this.processTable(node);
      case "br":
        return "\n";
      case "hr":
        return "\n---\n\n";
      default:
        return content;
    }
  }

  processTable(table) {
    const rows = Array.from(table.querySelectorAll("tr"));
    if (rows.length === 0) return "";

    let markdown = "\n";
    let headerProcessed = false;

    rows.forEach((row) => {
      const cells = Array.from(row.querySelectorAll("td, th"));
      const isHeaderRow =
        row.closest("thead") ||
        cells.some((cell) => cell.tagName.toLowerCase() === "th");

      if (cells.length > 0) {
        const cellContents = cells.map((cell) => {
          let content = this.processNode(cell).trim();
          content = content.replace(/\|/g, "\\|");
          return content || " ";
        });

        markdown += `| ${cellContents.join(" | ")} |\n`;

        if (isHeaderRow && !headerProcessed) {
          const separators = cellContents.map(() => "---");
          markdown += `| ${separators.join(" | ")} |\n`;
          headerProcessed = true;
        }
      }
    });

    return markdown + "\n";
  }
}

// Simple Markdown to HTML converter
class MarkdownToHtmlConverter {
  convert(markdown) {
    let html = markdown;

    // Headers
    html = html.replace(/^### (.*$)/gim, "<h3>$1</h3>");
    html = html.replace(/^## (.*$)/gim, "<h2>$1</h2>");
    html = html.replace(/^# (.*$)/gim, "<h1>$1</h1>");

    // Bold and Italic
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");

    // Code and Links
    html = html.replace(/`(.*?)`/g, "<code>$1</code>");
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

    // Tables (process before paragraph conversion)
    html = this.convertTables(html);

    // Split into lines for better processing
    const lines = html.split("\n");
    const processedLines = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip empty lines
      if (!line) continue;

      // Skip lines that are already HTML elements (headers, tables)
      if (
        line.match(
          /^<(h[1-6]|table|thead|tbody|tr|th|td|\/table|\/thead|\/tbody)/
        )
      ) {
        processedLines.push(line);
        continue;
      }

      // Wrap non-empty content in paragraphs
      if (line.length > 0) {
        processedLines.push(`<p>${line}</p>`);
      }
    }

    // Join processed lines
    html = processedLines.join("\n");

    // Clean up the output
    html = this.cleanupHtml(html);

    return html;
  }

  cleanupHtml(html) {
    // Remove empty paragraphs
    html = html.replace(/<p>\s*<\/p>/g, "");

    // Remove excessive line breaks
    html = html.replace(/(<br\s*\/?>)+/g, "<br>");

    // Remove line breaks before and after block elements
    html = html.replace(
      /<br>\s*(<\/?(h[1-6]|table|thead|tbody|tr|th|td|div)>)/g,
      "$1"
    );
    html = html.replace(
      /(<\/?(h[1-6]|table|thead|tbody|tr|th|td|div)>)\s*<br>/g,
      "$1"
    );

    // Remove line breaks at the beginning and end
    html = html.replace(/^(<br\s*\/?>)+|(<br\s*\/?>)+$/g, "");

    // Clean up multiple consecutive whitespace/newlines
    html = html.replace(/\n\s*\n\s*\n/g, "\n\n");

    // Remove trailing spaces
    html = html.replace(/ +$/gm, "");

    return html.trim();
  }

  convertTables(markdown) {
    const lines = markdown.split("\n");
    let html = "";
    let inTable = false;
    let isHeader = true;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.startsWith("|") && line.endsWith("|")) {
        if (!inTable) {
          html += '<table class="markdown-table">\n';
          inTable = true;
          isHeader = true;
        }

        // Skip separator rows
        if (line.match(/^\|[\s\-:]+\|$/)) {
          isHeader = false;
          continue;
        }

        const cells = line
          .slice(1, -1)
          .split("|")
          .map((cell) => cell.trim());
        const tag = isHeader ? "th" : "td";

        if (isHeader) {
          html += "<thead>\n";
        } else if (i > 0 && lines[i - 1].match(/^\|[\s\-:]+\|$/)) {
          html += "<tbody>\n";
        }

        html += "<tr>\n";
        cells.forEach((cell) => {
          html += `<${tag}>${cell}</${tag}>\n`;
        });
        html += "</tr>\n";

        if (isHeader && lines[i + 1] && lines[i + 1].match(/^\|[\s\-:]+\|$/)) {
          html += "</thead>\n";
        }
      } else {
        if (inTable) {
          html += "</tbody>\n</table>\n\n";
          inTable = false;
        }
        html += line + "\n";
      }
    }

    if (inTable) {
      html += "</tbody>\n</table>\n";
    }

    return html;
  }
}

const App = () => {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [htmlPreview, setHtmlPreview] = useState("");
  const [activeTab, setActiveTab] = useState("markdown");
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversionOptions, setConversionOptions] = useState({
    cleanRenderedMarkdown: true,
    removeExtraSpacing: true,
    handleAppleMarkup: true,
    preserveTableFormatting: true,
  });
  const inputRef = useRef(null);

  const cleanRenderedMarkdownHtml = useCallback(
    (html) => {
      let cleaned = html;

      cleaned = cleaned.replace(/<head[^>]*>.*?<\/head>/gi, "");
      cleaned = cleaned.replace(/<meta[^>]*>/gi, "");

      if (conversionOptions.handleAppleMarkup) {
        cleaned = cleaned.replace(
          /<span class="Apple-converted-space">\s*<\/span>/gi,
          " "
        );
        cleaned = cleaned.replace(
          /<span class="s\d+"[^>]*>(.*?)<\/span>/gi,
          "$1"
        );
        cleaned = cleaned.replace(
          /<p class="p\d+"[^>]*>(.*?)<\/p>/gi,
          "<p>$1</p>"
        );
      }

      cleaned = cleaned.replace(/\s*style="[^"]*"/gi, "");

      if (conversionOptions.removeExtraSpacing) {
        cleaned = cleaned.replace(/\s+/g, " ");
        cleaned = cleaned.replace(/>\s+</g, "><");
      }

      return cleaned.trim();
    },
    [conversionOptions]
  );

  const handlePaste = useCallback(async (event) => {
    event.preventDefault();
    setIsProcessing(true);

    try {
      const clipboardData = event.clipboardData;
      let htmlContent = clipboardData.getData("text/html");
      let plainText = clipboardData.getData("text/plain");

      const contentToProcess = htmlContent || plainText;

      if (contentToProcess) {
        setInputText(contentToProcess);
        setTimeout(() => convertToMarkdown(contentToProcess), 100);
      }
    } catch (error) {
      console.error("Paste operation failed:", error);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const convertToMarkdown = useCallback(
    (htmlInput = inputText) => {
      if (!htmlInput.trim()) {
        setOutputText("");
        setHtmlPreview("");
        return;
      }

      setIsProcessing(true);

      try {
        const cleanedHtml = conversionOptions.cleanRenderedMarkdown
          ? cleanRenderedMarkdownHtml(htmlInput)
          : htmlInput;

        const converter = new CustomMarkdownConverter();
        let markdown = converter.convert(cleanedHtml);

        markdown = markdown
          .replace(/[ \t]+$/gm, "")
          .replace(/\n\s*\n\s*\n/g, "\n\n")
          .replace(/\|\s*\|\s*\|/g, "| |")
          .trim();

        setOutputText(markdown);

        const markdownToHtml = new MarkdownToHtmlConverter();
        const preview = markdownToHtml.convert(markdown);
        setHtmlPreview(preview);
      } catch (error) {
        console.error("Conversion failed:", error);
        setOutputText(
          "Error: Conversion failed. Please check your HTML input."
        );
        setHtmlPreview("");
      } finally {
        setIsProcessing(false);
      }
    },
    [inputText, conversionOptions, cleanRenderedMarkdownHtml]
  );

  const copyToClipboard = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
  }, []);

  return (
    <div
      style={{
        fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#f6f8fa",
      }}
    >
      <header
        style={{
          background: "#fff",
          padding: "20px",
          borderBottom: "1px solid #e1e4e8",
          textAlign: "center",
        }}
      >
        <h1
          style={{ margin: "0 0 10px 0", color: "#0366d6", fontSize: "2rem" }}
        >
          Clipboard2MD
        </h1>
        <p style={{ margin: 0, color: "#586069", fontSize: "1.1rem" }}>
          Convert copied HTML content into clean, readable Markdown instantly.
          Paste from any rich text source and get Markdown output in one click.
        </p>
      </header>

      <div
        style={{
          background: "#fff",
          padding: "15px 20px",
          borderBottom: "1px solid #e1e4e8",
          display: "flex",
          gap: "20px",
          flexWrap: "wrap",
        }}
      >
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={conversionOptions.cleanRenderedMarkdown}
            onChange={(e) =>
              setConversionOptions((prev) => ({
                ...prev,
                cleanRenderedMarkdown: e.target.checked,
              }))
            }
          />
          Clean rendered markdown HTML
        </label>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={conversionOptions.handleAppleMarkup}
            onChange={(e) =>
              setConversionOptions((prev) => ({
                ...prev,
                handleAppleMarkup: e.target.checked,
              }))
            }
          />
          Handle Apple/macOS markup
        </label>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={conversionOptions.removeExtraSpacing}
            onChange={(e) =>
              setConversionOptions((prev) => ({
                ...prev,
                removeExtraSpacing: e.target.checked,
              }))
            }
          />
          Remove extra spacing
        </label>
      </div>

      <div style={{ flex: 1, background: "#fff", height: "60vh" }}>
        <PanelGroup direction="horizontal" autoSaveId="markdown-converter">
          <Panel defaultSize={50} minSize={25} maxSize={75} id="input-panel">
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "15px 20px",
                  borderBottom: "1px solid #e1e4e8",
                  background: "#fafbfc",
                }}
              >
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>
                  Rendered HTML Input
                </h3>
                <button
                  onClick={() => setInputText("")}
                  disabled={!inputText || isProcessing}
                  style={{
                    background: "#f6f8fa",
                    color: "#24292e",
                    border: "1px solid #d0d7de",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  Clear
                </button>
              </div>

              <textarea
                ref={inputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onPaste={handlePaste}
                placeholder="Paste HTML from rendered markdown here (e.g., from markdown preview, Apple Notes, etc.)..."
                style={{
                  flex: 1,
                  border: "none",
                  padding: "20px",
                  fontFamily: "Monaco, Menlo, Ubuntu Mono, monospace",
                  fontSize: "14px",
                  lineHeight: "1.5",
                  resize: "none",
                  outline: "none",
                  background: "#fff",
                }}
                disabled={isProcessing}
              />
              <div
                style={{
                  padding: "15px 20px",
                  borderTop: "1px solid #e1e4e8",
                  background: "#fafbfc",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <button
                  onClick={() => convertToMarkdown()}
                  disabled={!inputText.trim() || isProcessing}
                  style={{
                    background: "#0366d6",
                    color: "white",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: 500,
                  }}
                >
                  {isProcessing ? "Converting..." : "Convert to Markdown"}
                </button>
                <span style={{ fontSize: "12px", color: "#656d76" }}>
                  {inputText.length} characters
                </span>
              </div>
            </div>
          </Panel>

          <PanelResizeHandle id="main-resize-handle" />

          <Panel defaultSize={50} minSize={25} maxSize={75} id="output-panel">
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
              }}
            >
              <div
                style={{
                  display: "flex",
                  borderBottom: "1px solid #e1e4e8",
                  background: "#fafbfc",
                }}
              >
                <button
                  onClick={() => setActiveTab("markdown")}
                  style={{
                    flex: 1,
                    padding: "15px 20px",
                    border: "none",
                    background: activeTab === "markdown" ? "#fff" : "#fafbfc",
                    borderBottom:
                      activeTab === "markdown"
                        ? "2px solid #0366d6"
                        : "2px solid transparent",
                    cursor: "pointer",
                    fontSize: "16px",
                    fontWeight: activeTab === "markdown" ? 600 : 400,
                    color: activeTab === "markdown" ? "#0366d6" : "#586069",
                  }}
                >
                  Markdown Source
                </button>
                <button
                  onClick={() => setActiveTab("preview")}
                  style={{
                    flex: 1,
                    padding: "15px 20px",
                    border: "none",
                    background: activeTab === "preview" ? "#fff" : "#fafbfc",
                    borderBottom:
                      activeTab === "preview"
                        ? "2px solid #0366d6"
                        : "2px solid transparent",
                    cursor: "pointer",
                    fontSize: "16px",
                    fontWeight: activeTab === "preview" ? 600 : 400,
                    color: activeTab === "preview" ? "#0366d6" : "#586069",
                  }}
                >
                  HTML Preview
                </button>
                <div
                  style={{
                    padding: "15px 20px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <button
                    onClick={() =>
                      copyToClipboard(
                        activeTab === "markdown" ? outputText : htmlPreview
                      )
                    }
                    disabled={!outputText}
                    style={{
                      background: "#f6f8fa",
                      color: "#24292e",
                      border: "1px solid #d0d7de",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "14px",
                    }}
                  >
                    Copy {activeTab === "markdown" ? "Markdown" : "HTML"}
                  </button>
                </div>
              </div>

              {activeTab === "markdown" ? (
                <textarea
                  value={outputText}
                  readOnly
                  placeholder="Clean markdown will appear here..."
                  style={{
                    flex: 1,
                    border: "none",
                    padding: "20px",
                    fontFamily: "Monaco, Menlo, Ubuntu Mono, monospace",
                    fontSize: "14px",
                    lineHeight: "1.5",
                    resize: "none",
                    outline: "none",
                    background: "#f6f8fa",
                    color: "#24292e",
                  }}
                />
              ) : (
                <div
                  style={{
                    flex: 1,
                    padding: "20px",
                    overflow: "auto",
                    background: "#fff",
                    border: "none",
                  }}
                >
                  <style>
                    {`
                      .markdown-table {
                        border-collapse: collapse;
                        width: 100%;
                        margin: 16px 0;
                      }
                      .markdown-table th,
                      .markdown-table td {
                        border: 1px solid #d0d7de;
                        padding: 8px 12px;
                        text-align: left;
                      }
                      .markdown-table th {
                        background-color: #f6f8fa;
                        font-weight: 600;
                      }
                      .markdown-table tr:nth-child(even) {
                        background-color: #f6f8fa;
                      }
                    `}
                  </style>
                  {htmlPreview ? (
                    <div dangerouslySetInnerHTML={{ __html: htmlPreview }} />
                  ) : (
                    <div
                      style={{
                        color: "#586069",
                        fontStyle: "italic",
                        textAlign: "center",
                        marginTop: "40px",
                      }}
                    >
                      HTML preview will appear here...
                    </div>
                  )}
                </div>
              )}

              <div
                style={{
                  padding: "15px 20px",
                  borderTop: "1px solid #e1e4e8",
                  background: "#fafbfc",
                  display: "flex",
                  justifyContent: "flex-end",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: "12px", color: "#656d76" }}>
                  {activeTab === "markdown"
                    ? outputText.length
                    : htmlPreview.length}{" "}
                  characters
                </span>
              </div>
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
};

export default App;
