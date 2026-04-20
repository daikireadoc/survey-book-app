
export default function LegalPage() {
    return (
      <main
        style={{
          maxWidth: 800,
          margin: "0 auto",
          padding: "40px 20px",
          color: "var(--foreground)",
        }}
      >
        <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 24 }}>
          特定商取引法に基づく表記
        </h1>
  
        <section style={{ display: "grid", gap: 20 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>サービス名</h2>
            <p>ReaDoc</p>
          </div>
  
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>運営責任者</h2>
            <p>後藤 大輝</p>
          </div>
  
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>所在地</h2>
            <p>請求があった場合に遅滞なく開示します。</p>
          </div>
  
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>電話番号</h2>
            <p>請求があった場合に遅滞なく開示します。</p>
          </div>
  
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>メールアドレス</h2>
            <p>daiki.readoc@gmail.com</p>
          </div>
  
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>販売価格</h2>
            <p>各プランページに記載の金額をご参照ください。</p>
          </div>
  
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>
              商品代金以外の必要料金
            </h2>
            <p>
              インターネット接続に必要な通信料等はお客様のご負担となります。
            </p>
          </div>
  
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>支払方法</h2>
            <p>クレジットカード決済（Stripe）</p>
          </div>
  
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>支払時期</h2>
            <p>お申し込み時に決済されます。</p>
          </div>
  
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>サービス提供時期</h2>
            <p>決済完了後、直ちに利用可能です。</p>
          </div>
  
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>
              キャンセル・返金について
            </h2>
            <p>
              サービスの性質上、決済完了後の返金・キャンセルは原則としてお受けしておりません。
            </p>
          </div>
        </section>
      </main>
    );
  }