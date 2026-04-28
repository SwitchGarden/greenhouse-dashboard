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

interface CropItem {
  name: string;
  category: string;
  price: number;
  unit: 'each' | 'lb';
}

interface CropSelection {
  crop: string;
  weeklyQty: number;
  pricePerUnit: number;
  unit: 'each' | 'lb';
}

type ContractType = 'chef-partner' | 'wholesale' | '';
type TierName = 'bronze' | 'silver' | 'gold';
type Tier = TierName | '';

const CROP_CATALOG: CropItem[] = [
  { name: 'Romaine', category: 'Lettuce', price: 3.00, unit: 'each' },
  { name: 'Butterhead', category: 'Lettuce', price: 3.25, unit: 'each' },
  { name: 'Muir Lettuce', category: 'Lettuce', price: 3.25, unit: 'each' },
  { name: 'Oakleaf Lettuce', category: 'Lettuce', price: 3.25, unit: 'each' },
  { name: 'Swiss Chard', category: 'Lettuce', price: 3.00, unit: 'each' },
  { name: 'Bok Choy', category: 'Lettuce', price: 2.75, unit: 'each' },
  { name: 'Fennel', category: 'Lettuce', price: 3.00, unit: 'each' },
  { name: 'Salad Mix', category: 'Salad Mix', price: 6.50, unit: 'lb' },
  { name: 'Harvest Mix', category: 'Salad Mix', price: 6.50, unit: 'lb' },
  { name: 'Sunset Mix', category: 'Salad Mix', price: 7.00, unit: 'lb' },
  { name: 'Arugula', category: 'Salad Mix', price: 7.00, unit: 'lb' },
  { name: 'Kale', category: 'Salad Mix', price: 6.00, unit: 'lb' },
  { name: 'Basil', category: 'Fresh Herbs', price: 12.00, unit: 'lb' },
  { name: 'Thai Basil', category: 'Fresh Herbs', price: 12.00, unit: 'lb' },
  { name: 'Cilantro', category: 'Fresh Herbs', price: 10.00, unit: 'lb' },
  { name: 'Parsley', category: 'Fresh Herbs', price: 10.00, unit: 'lb' },
  { name: 'Chives', category: 'Fresh Herbs', price: 14.00, unit: 'lb' },
  { name: 'Mint', category: 'Fresh Herbs', price: 12.00, unit: 'lb' },
];

const CROP_MAP = Object.fromEntries(CROP_CATALOG.map(c => [c.name, c]));

const TIER_DETAILS: Record<TierName, { label: string; priceRange: string; discount: number; perks: string }> = {
  bronze: {
    label: 'Bronze',
    priceRange: '$150–$299 / week',
    discount: 5,
    perks: 'Priority harvest access, order grown & reserved, flexible add-ons, set delivery day',
  },
  silver: {
    label: 'Silver',
    priceRange: '$300–$499 / week',
    discount: 10,
    perks: 'All Bronze benefits, reserved crop allocation, custom weekly requests, dedicated account support',
  },
  gold: {
    label: 'Gold',
    priceRange: '$500+ / week',
    discount: 15,
    perks: 'All Silver benefits, dedicated crop rows, custom grow requests, highest volume priority',
  },
};

const containerStyle: React.CSSProperties = {
  fontFamily: "'Segoe UI', sans-serif",
  maxWidth: 860,
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
  signerName: string,
): string {
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const discountPct = tier && contractType === 'chef-partner' ? TIER_DETAILS[tier].discount : 0;

  const totalWeeklyFull = crops.reduce((s, c) => s + c.weeklyQty * c.pricePerUnit, 0);
  const totalWeeklyNet = totalWeeklyFull * (1 - discountPct / 100);

  const cropTable = crops.map(c => {
    const full = c.weeklyQty * c.pricePerUnit;
    const net = full * (1 - discountPct / 100);
    const unitLabel = c.unit === 'each' ? `${c.weeklyQty} ea` : `${c.weeklyQty} lb`;
    const priceLabel = c.unit === 'each' ? `$${c.pricePerUnit.toFixed(2)}/ea` : `$${c.pricePerUnit.toFixed(2)}/lb`;
    if (discountPct > 0) {
      return `  • ${c.crop}: ${unitLabel} @ ${priceLabel} = $${full.toFixed(2)} → $${net.toFixed(2)} after ${discountPct}% discount`;
    }
    return `  • ${c.crop}: ${unitLabel} @ ${priceLabel} = $${full.toFixed(2)}/week`;
  }).join('\n');

  const tierSection = contractType === 'chef-partner' && tier ? `
PARTNERSHIP TIER: ${TIER_DETAILS[tier].label.toUpperCase()} (${TIER_DETAILS[tier].priceRange})
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

Weekly Subtotal: $${totalWeeklyFull.toFixed(2)}${discountPct > 0 ? `\nPartner Discount (${discountPct}%): -$${(totalWeeklyFull - totalWeeklyNet).toFixed(2)}\nWeekly Total After Discount: $${totalWeeklyNet.toFixed(2)}` : `\nWeekly Total: $${totalWeeklyFull.toFixed(2)}`}

TERMS AND CONDITIONS:

1. DELIVERY: Switchpoint Garden will provide agreed produce on the scheduled harvest days. Delivery schedule to be confirmed weekly by Thursday for the following week.

2. QUALITY: All produce is grown using sustainable, hydroponic methods. Produce not meeting quality standards will be replaced or credited.

3. PAYMENT: Invoices issued weekly. Payment due within 15 days of invoice. A 1.5% monthly late fee applies to overdue balances.

4. MINIMUM ORDER: Purchaser agrees to maintain the weekly volumes listed above. Reductions of more than 20% require 2 weeks written notice.

5. MODIFICATIONS: Changes to crop selections require 3 weeks advance notice to allow for grow scheduling.

6. TERMINATION: Either party may terminate this agreement with 45 days written notice. Early termination by Purchaser within the first 90 days may result in a restocking fee equal to 2 weeks of the contracted value.

7. FORCE MAJEURE: Neither party shall be liable for delays or failures caused by events beyond their reasonable control.

8. GOVERNING LAW: This agreement shall be governed by the laws of the State of Utah.

SIGNATURES:

Switchpoint Garden                    ${info.restaurantName}
_____________________________         _____________________________
${signerName || ''}

_____________________________         _____________________________
Title                                 Title

_____________________________         _____________________________
Date                                  Date
`;
}

const defaultCrop = (): CropSelection => ({
  crop: CROP_CATALOG[0].name,
  weeklyQty: 10,
  pricePerUnit: CROP_CATALOG[0].price,
  unit: CROP_CATALOG[0].unit,
});

export default function ContractBuilder() {
  const [step, setStep] = useState(0);
  const [info, setInfo] = useState<RestaurantInfo>({
    restaurantName: '', contactName: '', email: '', phone: '',
    address: '', city: '', state: '', zip: '',
  });
  const [contractType, setContractType] = useState<ContractType>('');
  const [tier, setTier] = useState<Tier>('');
  const [crops, setCrops] = useState<CropSelection[]>([defaultCrop()]);
  const [startDate, setStartDate] = useState('');
  const [termMonths, setTermMonths] = useState(6);
  const [signerName, setSignerName] = useState('');
  const [copied, setCopied] = useState(false);

  const discountPct = tier && contractType === 'chef-partner' ? TIER_DETAILS[tier].discount : 0;
  const contractText = generateContract(info, contractType, tier, crops, startDate, termMonths, signerName);

  const addCrop = () => setCrops(prev => [...prev, defaultCrop()]);
  const removeCrop = (i: number) => setCrops(prev => prev.filter((_, idx) => idx !== i));

  const updateCropField = (i: number, field: keyof CropSelection, value: string | number) =>
    setCrops(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: value } : c));

  const selectCrop = (i: number, cropName: string) => {
    const item = CROP_MAP[cropName];
    if (!item) return;
    setCrops(prev => prev.map((c, idx) => idx === i
      ? { ...c, crop: cropName, pricePerUnit: item.price, unit: item.unit }
      : c
    ));
  };

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
        img { height: 120px; }
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

  const resetForm = () => {
    setStep(0);
    setInfo({ restaurantName: '', contactName: '', email: '', phone: '', address: '', city: '', state: '', zip: '' });
    setContractType('');
    setTier('');
    setCrops([defaultCrop()]);
    setStartDate('');
    setTermMonths(6);
    setSignerName('');
  };

  // Group crops by category for the select dropdown
  const categories = Array.from(new Set(CROP_CATALOG.map(c => c.category)));

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <img src="/gardennobkgd.png" alt="Switchpoint Garden" style={{ height: 96 }} />
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
            <div style={{ marginBottom: 16, padding: '12px 16px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
              <label style={labelStyle}>Switchpoint Authorized Signer Name</label>
              <input style={inputStyle} placeholder="Your name (appears on the contract signature line)"
                value={signerName} onChange={e => setSignerName(e.target.value)} />
            </div>
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
                <h4 style={{ color: '#166534', marginBottom: 12 }}>Select Tier</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  {(['bronze', 'silver', 'gold'] as TierName[]).map(t => (
                    <div key={t} onClick={() => setTier(t)} style={{
                      border: `2px solid ${tier === t ? '#16a34a' : '#e5e7eb'}`,
                      borderRadius: 8,
                      padding: 16,
                      cursor: 'pointer',
                      background: tier === t ? '#f0fdf4' : '#fff',
                      position: 'relative',
                    }}>
                      {t === 'silver' && (
                        <div style={{
                          position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                          background: '#1e3a1e', color: '#fff', fontSize: 10, fontWeight: 700,
                          padding: '2px 10px', borderRadius: 99, whiteSpace: 'nowrap',
                        }}>MOST POPULAR</div>
                      )}
                      <div style={{
                        display: 'inline-block',
                        background: '#b45309',
                        color: '#fff',
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 4,
                        marginBottom: 8,
                      }}>
                        {TIER_DETAILS[t].discount}% DISCOUNT
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 2 }}>
                        {t === 'bronze' ? '🥉' : t === 'silver' ? '🥈' : '🥇'} {TIER_DETAILS[t].label}
                      </div>
                      <div style={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>
                        {TIER_DETAILS[t].priceRange}
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
            {discountPct > 0 && (
              <div style={{
                background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8,
                padding: '8px 14px', marginBottom: 16, fontSize: 13, color: '#166534',
              }}>
                {TIER_DETAILS[tier as TierName].label} tier — <strong>{discountPct}% discount</strong> applied to all crops
              </div>
            )}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
              <thead>
                <tr style={{ background: '#f0fdf4' }}>
                  {['Crop', 'Qty / Week', 'List Price', 'Full Total', discountPct > 0 ? 'Net After Discount' : '', ''].map((h, hi) => (
                    h ? <th key={hi} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#166534' }}>{h}</th> : <th key={hi} />
                  ))}
                </tr>
              </thead>
              <tbody>
                {crops.map((c, i) => {
                  const fullWeekly = c.weeklyQty * c.pricePerUnit;
                  const netWeekly = fullWeekly * (1 - discountPct / 100);
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '8px 6px' }}>
                        <select style={{ ...inputStyle, padding: '6px 8px' }} value={c.crop}
                          onChange={e => selectCrop(i, e.target.value)}>
                          {categories.map(cat => (
                            <optgroup key={cat} label={cat}>
                              {CROP_CATALOG.filter(cr => cr.category === cat).map(cr => (
                                <option key={cr.name} value={cr.name}>{cr.name}</option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: '8px 6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <input style={{ ...inputStyle, padding: '6px 8px', width: 70 }} type="number" min={1} value={c.weeklyQty}
                            onChange={e => updateCropField(i, 'weeklyQty', Number(e.target.value))} />
                          <span style={{ fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap' }}>{c.unit}</span>
                        </div>
                      </td>
                      <td style={{ padding: '8px 10px', fontSize: 13, color: '#374151' }}>
                        ${c.pricePerUnit.toFixed(2)} / {c.unit}
                      </td>
                      <td style={{ padding: '8px 10px', fontSize: 13, fontWeight: 600, color: discountPct > 0 ? '#9ca3af' : '#166534', textDecoration: discountPct > 0 ? 'line-through' : 'none' }}>
                        ${fullWeekly.toFixed(2)}
                      </td>
                      {discountPct > 0 ? (
                        <td style={{ padding: '8px 10px', fontSize: 13, fontWeight: 700, color: '#166534' }}>
                          ${netWeekly.toFixed(2)}
                        </td>
                      ) : <td />}
                      <td style={{ padding: '8px 6px' }}>
                        {crops.length > 1 && (
                          <button onClick={() => removeCrop(i)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 16 }}>✕</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: '#f9fafb', borderTop: '2px solid #e5e7eb' }}>
                  <td colSpan={3} style={{ padding: '10px 10px', fontWeight: 600, fontSize: 13 }}>Weekly Total</td>
                  <td style={{ padding: '10px 10px', fontWeight: 700, color: discountPct > 0 ? '#9ca3af' : '#166534', fontSize: 14, textDecoration: discountPct > 0 ? 'line-through' : 'none' }}>
                    ${crops.reduce((s, c) => s + c.weeklyQty * c.pricePerUnit, 0).toFixed(2)}
                  </td>
                  {discountPct > 0 ? (
                    <td style={{ padding: '10px 10px', fontWeight: 700, color: '#166534', fontSize: 14 }}>
                      ${crops.reduce((s, c) => s + c.weeklyQty * c.pricePerUnit * (1 - discountPct / 100), 0).toFixed(2)}
                    </td>
                  ) : <td />}
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
              <img src="/gardennobkgd.png" alt="Switchpoint Garden" style={{ height: 112 }} />
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
              <button style={{ ...secondaryBtn, color: '#166534', borderColor: '#16a34a' }} onClick={resetForm}>
                + New Contract
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
