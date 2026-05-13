import type { Report } from "./analyzer";

export function reportToMarkdown(report: Report): string {
  const { snapshot, risks, products, missingInfo, nextSteps, scoring } = report;
  const lines: string[] = [];

  lines.push(`# Momo Insurance Analysis — ${snapshot.companyName}`);
  lines.push("");
  lines.push(`Generated: ${new Date().toLocaleString()}`);
  lines.push("");
  lines.push("## Company snapshot");
  lines.push(`- **Company**: ${snapshot.companyName}`);
  lines.push(`- **Website**: ${snapshot.website}`);
  lines.push(`- **Industry**: ${snapshot.industry}`);
  lines.push(`- **Country**: ${snapshot.country}`);
  lines.push(`- **Employees**: ${snapshot.employees}`);
  lines.push(`- **Revenue**: ${snapshot.revenue}`);
  lines.push("");
  lines.push(snapshot.summary);
  lines.push("");
  lines.push("## Scoring");
  lines.push(`- **Risk score**: ${scoring.riskScore}/100`);
  lines.push(`- **Lead score**: ${scoring.leadScore}/100`);
  lines.push(`- **Urgency**: ${scoring.urgency}`);
  lines.push(`- **Next action**: ${scoring.nextAction}`);
  lines.push("");
  lines.push("## Likely risk exposures");
  for (const r of risks) {
    lines.push(`### ${r.label} — ${r.level}`);
    lines.push(r.explanation);
    lines.push(`*Missing*: ${r.missing}`);
    lines.push("");
  }
  lines.push("## Recommended insurance products");
  for (const p of products) {
    lines.push(`### ${p.label} — ${p.priority}`);
    lines.push(`${p.why}`);
    lines.push(`*Trigger*: ${p.trigger}`);
    lines.push("");
  }
  lines.push("## Missing information");
  for (const m of missingInfo) lines.push(`- [ ] ${m}`);
  lines.push("");
  lines.push("## Suggested next steps");
  nextSteps.forEach((s, i) => lines.push(`${i + 1}. ${s}`));
  lines.push("");
  lines.push("---");
  lines.push("This analysis is informational only and does not constitute insurance advice.");
  return lines.join("\n");
}

export function downloadReport(report: Report) {
  const md = reportToMarkdown(report);
  const slug = (report.snapshot.companyName || "company")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `momo-analysis-${slug}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function buildMailto(report: Report, to?: string): string {
  const subject = `Momo Insurance Analysis — ${report.snapshot.companyName}`;
  const body = [
    `Hi,`,
    ``,
    `Please find below the Momo Insurance Analysis for ${report.snapshot.companyName}.`,
    ``,
    `Risk score: ${report.scoring.riskScore}/100`,
    `Urgency: ${report.scoring.urgency}`,
    `Next action: ${report.scoring.nextAction}`,
    ``,
    `Essential cover identified:`,
    ...report.products.filter((p) => p.priority === "Essential").map((p) => `- ${p.label}`),
    ``,
    `Full report attached.`,
  ].join("\n");
  return `mailto:${to ?? ""}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
