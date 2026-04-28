import React, { useState, useCallback } from 'react';

interface RestaurantInfo {
  restaurantName: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

interface CropSelection {
  crop: string;
  weeklyLbs: number;
  pricePerLb: number;
}

type ContractType = 'chef-partner' | 'wholesale' | '';
type TierName = 'bronze' | 'silver' | 'gold';
type Tier = TierName | '';

const CROPS = [
  'Butter Lettuce', 'Arugula', 'Spinach', 'Kale', 'Swiss Chard',
  'Basil', 'Cilantro', 'Parsley', 'Dill', 'Microgreens Mix',
  'Pea Shoots', 'Sunflower Shoots', 'Radish Microgreens', 'Broccoli Microgreens',
  'Mixed Lettuce', 'Mustard Greens', 'Watercress', 'Sorrel',
];

const TIER_DETAILS = {
  bronze: { label: 'Bronze', minWeekly: 5, discount: 0, perks: 'Access to seasonal crops, weekly harvest notifications' },
  silver: { label: 'Silver', minWeekly: 15, discount: 5, perks: 'Bronze perks + priority harvest selection, monthly farm visit' },
  gold: { label: 'Gold', minWeekly: 30, discount: 10, perks: 'Silver perks + custom grow requests, co-branding opportunities, quarterly planning sessions' },
};

const containerStyle: React.CSSProperties = {
  fontFamily: "'Segoe UI', sans-serif",
  maxWidth: 800,
  margin: '0 auto',
  padding: '24px 16px',
  color: '#1f2937',
};

const cardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 12,
  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
  padding: 28,
  marginBottom: 24,
};

const headingStyle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
  color: '#166534',
  marginBottom: 4,
};

const subheadStyle: React.CSSProperties = {
  fontSize: 14,
  color: '#6b7280',
  marginBottom: 24,
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: '#374151',
  marginBottom: 4,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  border: '1px solid #d1d5db',
  borderRadius: 6,
  fontSize: 14,
  boxSizing: 'border-box',
  outline: 'none',
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '16px',
};

const primaryBtn: React.CSSProperties = {
  background: '#16a34a',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  padding: '10px 22px',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
};

const secondaryBtn: React.CSSProperties = {
  background: '#f3f4f6',
  color: '#374151',
  border: '1px solid #d1d5db',
  borderRadius: 8,
  padding: '10px 22px',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
};

const stepBarStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  marginBottom: 28,
};

function StepBar({ step }: { step: number }) {
  const steps = ['Restaurant Info', 'Contract Type', 'Crops', 'Preview'];
  return (
    <div style={stepBarStyle}>
      {steps.map((label, i) => (
        <div key={i} style={{ flex: 1, textAlign: 'center' }}>
          <div style={{
            height: 6,
            borderRadius: 3,
            background: i < step ? '#16a34a' : i === step ? '#4ade80' : '#e5e7eb',
            marginBottom: 4,
          }} />
          <span style={{ fontSize: 11, color: i <= step ? '#166534' : '#9ca3af', fontWeight: i === step ? 700 : 400 }}>
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

function generateContract(
  info: RestaurantInfo,
  contractType: ContractType,
  tier: Tier,
  crops: CropSelection[],
  startDate: string,
  termMonths: number,
): string {
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const totalWeeklyLbs = crops.reduce((s, c) => s + c.weeklyLbs, 0);
  const totalWeeklyValue = crops.reduce((s, c) => s + c.weeklyLbs * c.pricePerLb, 0);
  const discountPct = tier && contractType === 'chef-partner' ? TIER_DETAILS[tier].discount : 0;
  const discountedValue = totalWeeklyValue * (1 - discountPct / 100);

  const cropTable = crops.map(c =>
    `  • ${c.crop}: ${c.weeklyLbs} lbs/week @ $${c.pricePerLb.toFixed(2)}/lb = $${(c.weeklyLbs * c.pricePerLb).toFixed(2)}/week`
  ).join('\n');

  const tierSection = contractType === 'chef-partner' && tier ? `
PARTNERSHIP TIER: ${TIER_DETAILS[tier].label.toUpperCase()}
Partner Benefits: ${TIER_DETAILS[tier].perks}
Volume Discount: ${discountPct}%
` : '';

  return `SWITCHPOINT GARDEN
PRODUCE SUPPLY AGREEMENT

Date: ${today}
Contract Type: ${contractType === 'chef-partner' ? 'Chef Partner Program' : 'Traditional Wholesale'}

SUPPLIER:
Switchpoint Garden
255 N 400 W, St. George, UT 84770
contact@switchpointcares.org

PURCHASER:
${info.restaurantName}
${info.contactName}
${info.address}
${info.city}, ${info.state} ${info.zip}
${info.email} | ${info.phone}
${tierSection}
TERM:
Start Date: ${startDate || 'TBD'}
Duration: ${termMonths} months
${startDate ? `End Date: ${new Date(new Date(startDate).setMonth(new Date(startDate).getMonth() + termMonths)).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}` : ''}

WEEKLY PRODUCE SCHEDULE:
${cropTable}

Weekly Subtotal: $${totalWeeklyValue.toFixed(2)}${discountPct > 0 ? `\nPartner Discount (${discountPct}%): -$${(totalWeeklyValue - discountedValue).toFixed(2)}\nWeekly Total After Discount: $${discountedValue.toFixed(2)}` : ''}
Estimated Monthly Value: $${(discountedValue * 4.33).toFixed(2)}
Estimated Contract Value: $${(discountedValue * 4.33 * termMonths).toFixed(2)}

TERMS AND CONDITIONS:

1. DELIVERY: Switchpoint Garden will provide agreed produce on the scheduled harvest days. Delivery schedule to be confirmed weekly by Thursday for the following week.

2. QUALITY: All produce is grown using sustainable, hydroponic methods. Produce not meeting quality standards will be replaced or credited.

3. PAYMENT: Invoices issued weekly. Payment due within 15 days of invoice. A 1.5% monthly late fee applies to overdue balances.

4. MINIMUM ORDER: Purchaser agrees to maintain the weekly minimum volumes listed above. Reductions of more than 20% require 2 weeks written notice.

5. MODIFICATIONS: Changes to crop selections require 3 weeks advance notice to allow for grow scheduling.

6. TERMINATION: Either party may terminate this agreement with 30 days written notice. Early termination by Purchaser within the first 90 days may result in a restocking fee equal to 2 weeks of the contracted value.

7. FORCE MAJEURE: Neither party shall be liable for delays or failures caused by events beyond their reasonable control.

8. GOVERNING LAW: This agreement shall be governed by the laws of the State of Utah.

SIGNATURES:

Switchpoint Garden                    ${info.restaurantName}
_____________________________         _____________________________
Authorized Signature                  ${info.contactName}

_____________________________         _____________________________
Printed Name / Title                  Title

_____________________________         _____________________________
Date                                  Date
`;
}

export default function ContractBuilder() {
  const [step, setStep] = useState(0);
  const [info, setInfo] = useState<RestaurantInfo>({
    restaurantName: '', contactName: '', email: '', phone: '',
    address: '', city: '', state: '', zip: '',
  });
  const [contractType, setContractType] = useState<ContractType>('');
  const [tier, setTier] = useState<Tier>('');
  const [crops, setCrops] = useState<CropSelection[]>([{ crop: CROPS[0], weeklyLbs: 5, pricePerLb: 8 }]);
  const [startDate, setStartDate] = useState('');
  const [termMonths, setTermMonths] = useState(6);
  const [copied, setCopied] = useState(false);

  const contractText = generateContract(info, contractType, tier, crops, startDate, termMonths);

  const addCrop = () => setCrops(prev => [...prev, { crop: CROPS[0], weeklyLbs: 5, pricePerLb: 8 }]);
  const removeCrop = (i: number) => setCrops(prev => prev.filter((_, idx) => idx !== i));
  const updateCrop = (i: number, field: keyof CropSelection, value: string | number) =>
    setCrops(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: value } : c));

  const copyContract = useCallback(async () => {
    await navigator.clipboard.writeText(contractText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [contractText]);

  const printContract = useCallback(() => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>Contract – ${info.restaurantName}</title>
      <style>
        body { font-family: 'Courier New', monospace; font-size: 12px; padding: 40px; max-width: 700px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 24px; }
        img { height: 60px; }
        pre { white-space: pre-wrap; word-wrap: break-word; }
      </style></head><body>
      <div class="header">
        <img src="/gardennobkgd.png" alt="Switchpoint Garden" />
        <br/><br/>
      </div>
      <pre>${contractText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
      </body></html>
    `);
    win.document.close();
    win.print();
  }, [contractText, info.restaurantName]);

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <img src="/gardennobkgd.png" alt="Switchpoint Garden" style={{ height: 48 }} />
          <div>
            <div style={headingStyle}>Contract Builder</div>
            <div style={subheadStyle}>Generate produce supply agreements for restaurant partners</div>
          </div>
        </div>
        <StepBar step={step} />

        {/* Step 0: Restaurant Info */}
        {step === 0 && (
          <div>
            <h3 style={{ marginTop: 0, color: '#166534' }}>Restaurant Information</h3>
            <div style={gridStyle}>
              <div>
                <label style={labelStyle}>Restaurant Name *</label>
                <input style={inputStyle} value={info.restaurantName}
                  onChange={e => setInfo(p => ({ ...p, restaurantName: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Contact Name *</label>
                <input style={inputStyle} value={info.contactName}
                  onChange={e => setInfo(p => ({ ...p, contactName: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Email *</label>
                <input style={inputStyle} type="email" value={info.email}
                  onChange={e => setInfo(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Phone</label>
                <input style={inputStyle} value={info.phone}
                  onChange={e => setInfo(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Street Address</label>
                <input style={inputStyle} value={info.address}
                  onChange={e => setInfo(p => ({ ...p, address: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>City</label>
                <input style={inputStyle} value={info.city}
                  onChange={e => setInfo(p => ({ ...p, city: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>State</label>
                  <input style={inputStyle} value={info.state}
                    onChange={e => setInfo(p => ({ ...p, state: e.target.value }))} />
                </div>
                <div>
                  <label style={labelStyle}>ZIP</label>
                  <input style={inputStyle} value={info.zip}
                    onChange={e => setInfo(p => ({ ...p, zip: e.target.value }))} />
                </div>
              </div>
            </div>
            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
              <button style={primaryBtn}
                disabled={!info.restaurantName || !info.contactName || !info.email}
                onClick={() => setStep(1)}>
                Next: Contract Type →
              </button>
            </div>
          </div>
        )}

        {/* Step 1: Contract Type */}
        {step === 1 && (
          <div>
            <h3 style={{ marginTop: 0, color: '#166534' }}>Select Contract Type</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              {(['chef-partner', 'wholesale'] as ContractType[]).map(type => (
                <div key={type} onClick={() => setContractType(type)} style={{
                  border: `2px solid ${contractType === type ? '#16a34a' : '#e5e7eb'}`,
                  borderRadius: 10,
                  padding: 20,
                  cursor: 'pointer',
                  background: contractType === type ? '#f0fdf4' : '#fff',
                }}>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, color: '#166534' }}>
                    {type === 'chef-partner' ? '🌿 Chef Partner Program' : '📦 Traditional Wholesale'}
                  </div>
                  <div style={{ fontSize: 13, color: '#6b7280' }}>
                    {type === 'chef-partner'
                      ? 'Tiered partnership with volume discounts, priority access, and custom grow options.'
                      : 'Standard wholesale agreement with fixed pricing and flexible ordering.'}
                  </div>
                </div>
              ))}
            </div>

            {contractType === 'chef-partner' && (
              <div>
                <h4 style={{ color: '#166534' }}>Select Tier</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  {(['bronze', 'silver', 'gold'] as TierName[]).map(t => (
                    <div key={t} onClick={() => setTier(t)} style={{
                      border: `2px solid ${tier === t ? '#16a34a' : '#e5e7eb'}`,
                      borderRadius: 8,
                      padding: 14,
                      cursor: 'pointer',
                      background: tier === t ? '#f0fdf4' : '#fff',
                    }}>
                      <div style={{ fontWeight: 700, textTransform: 'capitalize', marginBottom: 4 }}>
                        {t === 'bronze' ? '🥉' : t === 'silver' ? '🥈' : '🥇'} {TIER_DETAILS[t].label}
                      </div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>
                        Min {TIER_DETAILS[t].minWeekly} lbs/wk
                        {TIER_DETAILS[t].discount > 0 && ` · ${TIER_DETAILS[t].discount}% off`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Contract Start Date</label>
                <input style={inputStyle} type="date" value={startDate}
                  onChange={e => setStartDate(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Term (months)</label>
                <select style={inputStyle} value={termMonths}
                  onChange={e => setTermMonths(Number(e.target.value))}>
                  {[3, 6, 9, 12, 18, 24].map(m => (
                    <option key={m} value={m}>{m} months</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
              <button style={secondaryBtn} onClick={() => setStep(0)}>← Back</button>
              <button style={primaryBtn}
                disabled={!contractType || (contractType === 'chef-partner' && !tier)}
                onClick={() => setStep(2)}>
                Next: Select Crops →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Crop Selection */}
        {step === 2 && (
          <div>
            <h3 style={{ marginTop: 0, color: '#166534' }}>Weekly Crop Schedule</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
              <thead>
                <tr style={{ background: '#f0fdf4' }}>
                  {['Crop', 'Lbs/Week', 'Price/Lb', 'Weekly Value', ''].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#166534' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {crops.map((c, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '8px 6px' }}>
                      <select style={{ ...inputStyle, padding: '6px 8px' }} value={c.crop}
                        onChange={e => updateCrop(i, 'crop', e.target.value)}>
                        {CROPS.map(cr => <option key={cr} value={cr}>{cr}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '8px 6px' }}>
                      <input style={{ ...inputStyle, padding: '6px 8px' }} type="number" min={1} value={c.weeklyLbs}
                        onChange={e => updateCrop(i, 'weeklyLbs', Number(e.target.value))} />
                    </td>
                    <td style={{ padding: '8px 6px' }}>
                      <input style={{ ...inputStyle, padding: '6px 8px' }} type="number" min={0} step={0.25} value={c.pricePerLb}
                        onChange={e => updateCrop(i, 'pricePerLb', Number(e.target.value))} />
                    </td>
                    <td style={{ padding: '8px 6px', fontWeight: 600 }}>
                      ${(c.weeklyLbs * c.pricePerLb).toFixed(2)}
                    </td>
                    <td style={{ padding: '8px 6px' }}>
                      {crops.length > 1 && (
                        <button onClick={() => removeCrop(i)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 16 }}>✕</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: '#f9fafb' }}>
                  <td colSpan={3} style={{ padding: '8px 10px', fontWeight: 600, fontSize: 13 }}>Weekly Total</td>
                  <td style={{ padding: '8px 10px', fontWeight: 700, color: '#166534' }}>
                    ${crops.reduce((s, c) => s + c.weeklyLbs * c.pricePerLb, 0).toFixed(2)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
            <button style={{ ...secondaryBtn, fontSize: 13 }} onClick={addCrop}>+ Add Crop</button>

            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
              <button style={secondaryBtn} onClick={() => setStep(1)}>← Back</button>
              <button style={primaryBtn} disabled={crops.length === 0} onClick={() => setStep(3)}>
                Preview Contract →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Preview */}
        {step === 3 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0, color: '#166534' }}>Contract Preview</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={secondaryBtn} onClick={copyContract}>
                  {copied ? '✓ Copied!' : '📋 Copy'}
                </button>
                <button style={primaryBtn} onClick={printContract}>
                  🖨 Print / Save PDF
                </button>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <img src="/gardennobkgd.png" alt="Switchpoint Garden" style={{ height: 56 }} />
            </div>

            <div style={{
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              padding: 20,
              fontFamily: "'Courier New', monospace",
              fontSize: 12,
              whiteSpace: 'pre-wrap',
              lineHeight: 1.6,
              maxHeight: 500,
              overflowY: 'auto',
            }}>
              {contractText}
            </div>

            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
              <button style={secondaryBtn} onClick={() => setStep(2)}>← Edit Crops</button>
              <button style={{ ...secondaryBtn, color: '#166534', borderColor: '#16a34a' }}
                onClick={() => { setStep(0); setInfo({ restaurantName: '', contactName: '', email: '', phone: '', address: '', city: '', state: '', zip: '' }); setContractType(''); setTier(''); setCrops([{ crop: CROPS[0], weeklyLbs: 5, pricePerLb: 8 }]); setStartDate(''); setTermMonths(6); }}>
                + New Contract
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
