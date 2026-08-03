import { useState } from "react";
import { useStore } from "../lib/store";
import { Btn, Field, Input, Textarea } from "../components/ui";
import { Section } from "./shared";

export default function Contact() {
  const { toast } = useStore();
  const [f, setF] = useState({ name: "", email: "", company: "", msg: "" });

  const send = () => {
    if (!f.name.trim() || !f.email.trim()) return toast("Name and email required");
    toast("Message sent ✓ — we'll reply within one business day");
    setF({ name: "", email: "", company: "", msg: "" });
  };

  return (
    <Section
      kicker="Contact"
      title="Talk to a containment specialist"
      sub="Tell us what you're sorting and which OEM is on your back — we'll show you Gatekeeper running on data like yours."
    >
      <div className="mt-10 max-w-2xl">
        <div className="rounded-lg border border-line bg-surface p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Name"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
            <Field label="Email"><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
          </div>
          <Field label="Company"><Input placeholder="optional" value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} /></Field>
          <Field label="What are you containing?">
            <Textarea rows={4} placeholder="Part type, volumes, containment level…" value={f.msg} onChange={(e) => setF({ ...f, msg: e.target.value })} />
          </Field>
          <Btn onClick={send}>Send message</Btn>
        </div>
      </div>
    </Section>
  );
}
