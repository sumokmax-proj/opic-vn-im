import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

function splitIntoSections(markdown) {
  const lines = markdown.split('\n')
  const sections = []
  let current = null

  for (const line of lines) {
    if (/^## /.test(line)) {
      if (current) sections.push(current)
      current = { heading: line.replace(/^## /, '').trim(), body: [] }
    } else {
      if (!current) current = { heading: null, body: [] }
      current.body.push(line)
    }
  }
  if (current) sections.push(current)
  return sections.filter(s => s.heading || s.body.some(l => l.trim()))
}

const mdComponents = {
  h1: ({ children }) => (
    <h1 className="text-sm font-bold text-[#2C2C2C] mb-2">{children}</h1>
  ),
  h3: ({ children }) => (
    <h3 className="text-xs font-semibold text-[#8C8480] uppercase tracking-wide mt-3 mb-1.5">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="text-sm text-[#2C2C2C] leading-relaxed">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="space-y-1 mt-1">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="space-y-1 mt-1 list-decimal list-inside">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="text-sm text-[#4A4340] leading-relaxed flex gap-2">
      <span className="text-[#C4BFB9] shrink-0 mt-0.5 select-none">–</span>
      <span>{children}</span>
    </li>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-[#7C6F5B]">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="not-italic text-[#8C8480]">{children}</em>
  ),
  pre: ({ children }) => (
    <pre className="bg-[#F0EDE8] rounded-lg p-3 text-xs font-mono whitespace-pre-wrap break-words overflow-x-auto leading-relaxed">{children}</pre>
  ),
  code: ({ node, inline, children, ...props }) => {
    if (inline) {
      return <code className="bg-[#F0EDE8] text-[#7C6F5B] rounded px-1.5 py-0.5 text-xs font-mono">{children}</code>
    }
    // block code inside <pre> — styling handled by pre
    return <code className="text-[#7C6F5B]">{children}</code>
  },
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-[#E8E4DF] pl-3 text-sm text-[#8C8480]">{children}</blockquote>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto mt-2 rounded-lg border border-[#E8E4DF]">
      <table className="w-full text-sm border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-[#F5F3EF]">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="text-left text-xs font-semibold text-[#4A4340] px-3 py-2 border-b border-[#E8E4DF]">{children}</th>
  ),
  td: ({ children }) => (
    <td className="text-sm text-[#4A4340] px-3 py-2 border-b border-[#E8E4DF] last:border-b-0">{children}</td>
  ),
  hr: () => (
    <hr className="border-[#E8E4DF] my-3" />
  ),
}

export default function Analysis({ status, result, error }) {
  if (status === 'idle') return null

  return (
    <div className="w-full">
      {status === 'loading' && (
        <div className="flex items-center justify-center gap-2 py-8 text-[#8C8480] text-sm">
          <svg className="animate-spin w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          분석 중...
        </div>
      )}

      {status === 'error' && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          오류: {error}
        </div>
      )}

      {status === 'done' && (
        <div className="bg-[#F5F3EF] rounded-lg p-3 space-y-2">
          {splitIntoSections(result).map((section, i) => (
            <div key={i} className="bg-white rounded-lg p-4 space-y-2">
              {section.heading && (
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-0.5 h-4 bg-[#7C6F5B] rounded-full shrink-0" />
                  <h2 className="text-sm font-bold text-[#2C2C2C]">{section.heading}</h2>
                </div>
              )}
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                {section.body.join('\n')}
              </ReactMarkdown>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
