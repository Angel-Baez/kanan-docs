interface Signer {
  label: string;
}

interface SignatureBlockProps {
  signers: Signer[];
}

export function SignatureBlock({ signers }: SignatureBlockProps) {
  return (
    <div className="sgs">
      {signers.map((s, i) => (
        <div key={i}>
          <div className="sl" />
          <div className="sll">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
