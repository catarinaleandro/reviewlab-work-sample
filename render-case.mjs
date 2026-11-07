import fs from 'node:fs';
import { marked } from 'marked';

// The README owns case-study copy. The static page reuses its decision and evidence sections.
const md = fs.readFileSync(new URL('./README.md', import.meta.url), 'utf8');
const sections = [
  ['Product stage and my role', 'stage'],
  ['Limitations', 'limitations'],
  ['What I tested', 'evidence'],
  ['Assumptions behind the design', 'choices'],
  ['How I would apply this at TikTok', 'pilot'],
  ['Explore the prototype', 'explore'],
];
function sectionBetween(startText, endText) {
  const start = md.indexOf(startText);
  const end = md.indexOf(endText, start + startText.length);
  if (start < 0 || end < 0) throw new Error('Missing README boundary for ' + startText);
  return md.slice(start, end);
}
const decisions = marked
  .parse(sectionBetween('## Two decisions', '[Read the public case study]'))
  .replace('<h2>', '<h2 id="decisions">');
const body = sectionBetween('## Product stage and my role', '## Run and reproduce');
let content = marked.parse(body);
for (const [title, id] of sections) {
  const tag = '<h2>' + title + '</h2>';
  if (!content.includes(tag)) throw Error('Missing section ' + title);
  content = content.replace(tag, '<h2 id="' + id + '">' + title + '</h2>');
}
const introduction = marked.parse(
  sectionBetween('<!-- queue-example -->', '## Two decisions').replace('<!-- queue-example -->', '').trim(),
);
const study = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="Catarina Leandro’s AI product case study on prioritising TikTok comments for human review. Explore the decision, experiments and proposed pilot.">
<title>ReviewLab · Product case study · Catarina Leandro</title>
<style>
:root{color-scheme:light;--paper:#fafbf7;--ink:#19352e;--muted:#485f54;--green:#236346;--line:#d5dfd3;--tint:#edf3e8}
*{box-sizing:border-box}html{scroll-behavior:smooth;scroll-padding-top:1.2rem}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.65 'DM Sans',system-ui,sans-serif}
a{color:var(--green);text-underline-offset:.2em}a:focus-visible,summary:focus-visible{outline:3px solid #af622e;outline-offset:3px}
header{border-bottom:1px solid var(--line);background:#fff}.top,main,footer{max-width:1016px;margin:auto;padding-inline:clamp(18px,5vw,54px)}.top{display:flex;align-items:center;justify-content:space-between;gap:16px;min-height:65px}.wordmark{font-size:1.2rem;font-weight:760;letter-spacing:-.045em}.top a{font-size:.9rem}
.intro{padding:clamp(28px,5vw,64px) 0 26px}.byline,figcaption{color:var(--muted);font-size:.91rem}.byline{margin:0 0 12px}h1,h2{font-family:Manrope,system-ui,sans-serif;line-height:1.15;letter-spacing:-.038em}h1{font-size:clamp(2.25rem,5.5vw,4rem);max-width:19ch;margin:0 0 18px}h2{font-size:clamp(1.45rem,3vw,2.05rem);border-top:1px solid var(--line);padding-top:31px;margin:36px 0 12px}p{max-width:78ch;margin:.8rem 0}.queue-example>p:first-child{max-width:72ch;font-size:1.08rem}.queue-example table{margin:18px 0}.queue-example th:first-child,.queue-example td:first-child{width:auto;white-space:nowrap}.links,nav{display:flex;gap:10px 20px;flex-wrap:wrap}.links{margin:18px 0 0;align-items:center}.button{display:inline-block;background:var(--ink);color:white;padding:8px 14px;border-radius:5px;text-decoration:none}.button:hover{background:var(--green)}nav{font-size:.92rem;margin:18px 0 26px}h3{margin:20px 0 6px;line-height:1.3}figure{margin:0;background:#fff;border:1px solid var(--line);padding:16px 20px;border-radius:9px}figure ol{margin:.45rem 0;padding-left:1.8rem}figure li{padding-left:.45rem;margin:.25rem 0}figure .miss{border-top:1px dashed #adbdac;padding-top:.42rem}.miss strong{color:#88472e}
table{width:100%;border-collapse:collapse;font-size:.94rem;margin:18px 0 22px}th,td{padding:12px 14px;border:1px solid var(--line);vertical-align:top;text-align:left}th{background:var(--tint)}td{background:#fff}td:first-child{width:26%}ol,ul{padding-left:1.35rem}li{margin:.65rem 0}footer{margin-top:36px;padding-block:20px 44px;color:var(--muted);font-size:.9rem}
@media(max-width:640px){table,tbody,tr,td{display:block}table{border:0}thead{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}tbody tr{border:1px solid var(--line);background:white;margin:.8rem 0;border-radius:6px;overflow:hidden}td,td:first-child{width:auto;border:0;padding:8px 13px}td:first-child{background:var(--tint);font-weight:650}td::before{content:attr(data-label);display:block;font-size:.76rem;font-weight:650;color:var(--muted)}td:empty{display:none}li{margin:.7rem 0}.intro{padding-bottom:18px}}
@media print{header,nav,.links,footer{display:none}main{max-width:none;padding:0}h1{font-size:30pt}h2{font-size:17pt;break-after:avoid}figure,tr{break-inside:avoid}body{background:white;font-size:10pt}a{color:inherit}}
</style></head><body><header><div class="top"><span class="wordmark">ReviewLab</span><a href="/#queue">Open dashboard →</a></div></header>
<main><div class="intro"><p class="byline">Catarina Leandro · Independent AI product work sample · November 2026</p>
<h1>Which comments should a moderator review first?</h1><div class="queue-example">${introduction}</div>
</div>
${decisions}
<div class="links"><a class="button" href="/#models">Explore the model comparison</a><a href="/#policy">See the reviewer rubric</a></div>
<nav aria-label="Case study sections"><a href="#stage">Product stage</a><a href="#evidence">Experiments</a><a href="#limitations">Limitations</a><a href="#choices">Design choices</a><a href="#pilot">Proposed TikTok pilot</a></nav>
${content}</main><footer>ReviewLab · Catarina Leandro</footer></body></html>`;
// Supply real visible column labels for cards on small screens.
const labelled = study.replace(/<table>([\s\S]*?)<\/table>/g, (table) => {
  const heads = [...table.matchAll(/<th>(.*?)<\/th>/g)].map((match) => match[1]);
  return table.replace(
    /<tbody>([\s\S]*?)<\/tbody>/g,
    (_, rows) =>
      '<tbody>' +
      rows.replace(/<tr>([\s\S]*?)<\/tr>/g, (_, cells) => {
        let i = 0;
        return (
          '<tr>' + cells.replace(/<td>/g, () => '<td data-label="' + heads[i++] + '">') + '</tr>'
        );
      }) +
      '</tbody>',
  );
});
fs.writeFileSync(new URL('./dist/work-sample.html', import.meta.url), labelled);
