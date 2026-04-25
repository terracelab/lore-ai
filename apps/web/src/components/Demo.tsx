const py = `class Subscription(models.Model):
    """
    @Domain: subscription/master
    @BusinessLogic: valid_until 지나면 is_active=False
    @History:
      - 2024-03-15: trial 7일 → 14일
      - 2024-11-02: valid_until NOT NULL 강제
    """`;

const tsx = `/**
 * @Domain auth/profile
 * @BusinessLogic 구독 등급 + trial 남은일수 표기
 */
export default function ProfileCard(props: Props) { ... }`;

export function Demo() {
  return (
    <section className="border-t border-border/60 bg-bg">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="text-3xl font-semibold tracking-tight">코드 옆에 직접 적습니다</h2>
        <p className="mt-3 max-w-prose text-muted">
          README · Notion 처럼 따로 관리하지 않습니다. 주석은 코드와 함께 PR 에 따라 움직이고, 자동
          추출됩니다.
        </p>

        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          <CodeCard label="Python · Django" code={py} />
          <CodeCard label="TypeScript · React / RN" code={tsx} />
        </div>
      </div>
    </section>
  );
}

function CodeCard({ label, code }: { label: string; code: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-bg shadow-sm">
      <div className="border-b border-border px-4 py-2 font-mono text-xs text-muted">
        {label}
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-xs leading-6 text-fg">
        <code>{code}</code>
      </pre>
    </div>
  );
}
