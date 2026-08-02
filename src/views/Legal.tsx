export default function Legal() {
  const h3 = "mb-2 mt-6 font-disp text-sm font-black uppercase tracking-[0.05em] text-accent";
  const p = "mb-3 text-sm leading-relaxed text-ink-soft";
  return (
    <div className="mx-auto max-w-[800px] rounded-lg border border-line bg-surface p-8">
      <div className="mb-8 text-center">
        <h2 className="font-disp text-2xl font-black uppercase text-white">Legal &amp; Compliance</h2>
        <p className="mt-1 text-ink-soft">Michigan-Based Quality Containment Standards</p>
      </div>

      <h3 className={h3}>1. Michigan Law Statements</h3>
      <p className={p}>
        <b className="text-ink">MIOSHA Compliance:</b> All containment and sorting activities managed through this
        platform are subject to the Michigan Occupational Safety and Health Act (MIOSHA). Facilities utilizing
        Gatekeeper must ensure that all personnel follow established safety protocols for handling industrial
        components.
      </p>
      <p className={p}>
        <b className="text-ink">Michigan Uniform Commercial Code (UCC):</b> In accordance with the Michigan UCC,
        Gatekeeper provides documentation for the inspection and rejection of non-conforming goods. This data serves
        as primary evidence for quality claims and supplier chargebacks within the state of Michigan.
      </p>

      <h3 className={h3}>2. Terms of Service</h3>
      <p className={p}>
        <b className="text-ink">Data Sovereignty:</b> This application is a client-side prototype. All data entered
        is stored within the user's local browser storage (IndexedDB/LocalStorage). Users are responsible for
        maintaining backups of critical quality records.
      </p>
      <p className={p}>
        <b className="text-ink">Limitation of Liability:</b> Gatekeeper is provided "as-is" for industrial process
        optimization. While we strive for 100% data integrity, the developers are not liable for production
        downtime, OEM fines, or shipping delays resulting from the use or misuse of this software.
      </p>
      <p className={p}>
        <b className="text-ink">Confidentiality:</b> Part numbers, defect location maps, and pricing data are
        considered proprietary information of the respective manufacturer. This software does not transmit this data
        to external servers in its current configuration.
      </p>

      <h3 className={h3}>3. Certifications &amp; Standards</h3>
      <ul className="list-disc pl-5">
        <li className={p}>Aligned with IATF 16949 Quality Management Systems</li>
        <li className={p}>Supports Michigan-based Tier 1 &amp; Tier 2 automotive supply chains</li>
        <li className={p}>Built for "Michigan Made" industrial excellence</li>
      </ul>

      <div className="mt-10 border-t border-line pt-5 text-center">
        <p className="font-mono text-[11px] text-ink-soft">
          Gatekeeper v3.0.0-MI · Registered in Wayne County, MI
        </p>
      </div>
    </div>
  );
}
