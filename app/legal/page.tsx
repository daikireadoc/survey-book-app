
export default function LegalPage() {
    return (
      <main
        style={{
          maxWidth: 800,
          margin: "0 auto",
          padding: "40px 20px",
          color: "var(--foreground)",
          lineHeight: 1.9,
        }}
      >
        <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 24 }}>
          特定商取引法に基づく表記
        </h1>
  
        <section style={{ display: "grid", gap: 28 }}>
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
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>
              メールアドレス
            </h2>
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
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>
              サービス提供時期
            </h2>
            <p>決済完了後、直ちに利用可能です。</p>
          </div>
  
          {/* 追加① */}
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>
              キャンセル（解約）について
            </h2>
  
            <p>
              お客様は、当アプリのプラン管理ページにより、
              いつでもサブスクリプション契約を解約することができます。
            </p>
  
            <p>
              解約後は次回更新以降の料金請求は行われません。
            </p>
  
            <p>
              なお、解約後はサービスをご利用いただけなくなります。
            </p>
          </div>
  
          {/* 追加② */}
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>
              返金について
            </h2>
  
            <p>
              サービスの性質上、決済完了後の返金・日割り返金には対応しておりません。
            </p>
  
            <p>
              ただし、当社の責に帰すべき重大な不具合等が認められる場合は、
              個別に対応する場合があります。
            </p>
          </div>
  
          {/* 追加③ */}
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>
              動作環境
            </h2>
  
            <p>
              本サービス「ReaDoc」は、Webブラウザ上で利用する
              クラウド型サービスです。
            </p>
  
            <div style={{ marginTop: 12 }}>
              <strong>【対応デバイス】</strong>
              <p>・パソコン（Windows / Mac）</p>
            </div>
  
            <div style={{ marginTop: 12 }}>
              <strong>【対応OS】</strong>
              <p>・Windows 10 / 11 以降</p>
              <p>・macOS 12 以降</p>
            </div>
  
            <div style={{ marginTop: 12 }}>
              <strong>【対応ブラウザ】</strong>
              <p>・Google Chrome 最新版</p>
              <p>・Microsoft Edge 最新版</p>
              <p>・Safari 最新版</p>
            </div>
  
            <div style={{ marginTop: 12 }}>
              <strong>【インターネット環境】</strong>
              <p>
                ・ブロードバンド回線など、安定したインターネット接続環境
              </p>
            </div>
  
            <div style={{ marginTop: 12 }}>
              <strong>【その他】</strong>
              <p>・PDFの表示・保存ができる環境</p>
              <p>
                ・JavaScript、Cookieが有効になっているブラウザ環境
              </p>
              <p>・メールを受信できる環境</p>
            </div>
  
            <div style={{ marginTop: 12 }}>
              <strong>【推奨環境】</strong>
              <p>
                安定した動作のため、Google Chrome最新版での利用を推奨します。
              </p>
            </div>
  
            <div style={{ marginTop: 12 }}>
              <strong>【注意事項】</strong>
              <p>
                ご利用環境、ブラウザ設定、通信状況等により、
                一部機能が正常に動作しない場合があります。
              </p>
  
              <p>
                OSやブラウザ等のアップデートに伴い、
                動作環境が変更となる場合があります。
              </p>
            </div>
          </div>
  
          {/* 追加④ */}
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>
              商品の瑕疵に関する責任
            </h2>
  
            <p>
              販売者は、本ソフトウェアに重大な瑕疵が発見された場合、
              お客様に対し瑕疵のある旨を通知するとともに、
              瑕疵のない本ソフトウェアを提供する等、
              必要な範囲で修正対応を行います。
            </p>
  
            <p>
              ただし、本サービスの完全性、正確性、
              特定目的への適合性等を保証するものではありません。
            </p>
  
            <p>
              また、本ソフトウェアの利用により発生した損害について、
              当社に故意または重大な過失がある場合を除き、
              一切の責任を負いません。
            </p>
          </div>
        </section>
      </main>
    );
  }