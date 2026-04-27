import type { CsFields } from "@kanan/shared";
import { DocFooter } from "../components/ui/DocFooter.tsx";
import { DocHeader } from "../components/ui/DocHeader.tsx";
import { EditableField } from "../components/ui/EditableField.tsx";
import { SignatureBlock } from "../components/ui/SignatureBlock.tsx";
import { useDocument } from "../context/DocumentContext.tsx";

const CLAUSE_TITLES = [
  "PRIMERA · Objeto del contrato",
  "SEGUNDA · Alcance",
  "TERCERA · Plazo de ejecución",
  "CUARTA · Precio y forma de pago",
  "QUINTA · Obligaciones del contratista",
  "SEXTA · Obligaciones del contratante",
  "SÉPTIMA · Modificaciones",
  "OCTAVA · Garantía",
  "NOVENA · Fuerza mayor",
  "DÉCIMA · Resolución de conflictos",
  "UNDÉCIMA · Vigencia",
];

export function ContratoServiciosDoc() {
  const { fields, dispatch } = useDocument();
  const f = fields as CsFields;
  const set = (path: string, value: unknown) =>
    dispatch({ type: "SET_FIELD", path, value });

  return (
    <div className="doc on">
      <p className="hint">Haz clic en cualquier campo para editar</p>
      <DocHeader docType="Contrato de Servicios" />

      <div className="sd">Comparecientes</div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
          marginBottom: 14,
        }}
      >
        <div>
          <div className="lb">EL CONTRATANTE</div>
          <div style={{ fontSize: 12, lineHeight: 1.7, marginTop: 6 }}>
            <strong>
              <EditableField
                value={f.contracteeName}
                onChange={(v) => set("contracteeName", v)}
                size={24}
              />
            </strong>
            , portador/a de la cédula No.{" "}
            <EditableField
              value={f.contracteeId}
              onChange={(v) => set("contracteeId", v)}
              size={14}
            />
            , domiciliado/a en{" "}
            <EditableField
              value={f.contracteeAddress}
              onChange={(v) => set("contracteeAddress", v)}
              size={30}
              multiline
            />
            .
          </div>
        </div>
        <div>
          <div className="lb">EL CONTRATISTA</div>
          <div style={{ fontSize: 12, lineHeight: 1.7, marginTop: 6 }}>
            <strong>
              <EditableField
                value={f.contractorName}
                onChange={(v) => set("contractorName", v)}
                size={22}
              />
            </strong>
            , representada por{" "}
            <EditableField
              value={f.contracteeRep}
              onChange={(v) => set("contracteeRep", v)}
              size={18}
            />
            , cédula{" "}
            <EditableField
              value={f.contractorId}
              onChange={(v) => set("contractorId", v)}
              size={14}
            />
            , RNC{" "}
            <EditableField
              value={f.contracteeRnc}
              onChange={(v) => set("contracteeRnc", v)}
              size={14}
            />
            , domiciliado/a en{" "}
            <EditableField
              value={f.contractorAddress}
              onChange={(v) => set("contractorAddress", v)}
              size={26}
            />
            .
          </div>
        </div>
      </div>

      <div className="ot2" style={{ marginBottom: 0 }}>
        <div>
          <div className="lb">Ref. Alcance de Trabajo (SOW)</div>
          <div className="ov">
            <EditableField value={f.sowRef} onChange={(v) => set("sowRef", v)} />
          </div>
        </div>
      </div>

      <div className="sd">Preámbulo</div>
      <div
        style={{
          fontSize: 11.5,
          color: "var(--c)",
          lineHeight: 1.7,
          marginBottom: 6,
        }}
      >
        EL CONTRATANTE desea ejecutar trabajos de remodelación en el inmueble
        descrito, y EL CONTRATISTA cuenta con la experiencia y los recursos para
        llevarlos a cabo. Por tanto, ambas partes acuerdan suscribir el presente
        contrato, sujeto a las siguientes cláusulas:
      </div>

      {f.clauses.map((clause, i) => (
        <div key={i} style={{ margin: "14px 0" }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: "var(--accent)",
              marginBottom: 5,
              textTransform: "uppercase",
            }}
          >
            {CLAUSE_TITLES[i]}
          </div>
          <div style={{ fontSize: 11.5, lineHeight: 1.7 }}>
            <EditableField
              value={clause.body}
              onChange={(v) => {
                const arr = f.clauses.map((c, j) =>
                  j === i ? { ...c, body: v } : c,
                );
                set("clauses", arr);
              }}
              multiline
            />
          </div>
        </div>
      ))}

      <div className="trm" style={{ marginTop: 20 }}>
        <EditableField
          value={f.closingText}
          onChange={(v) => set("closingText", v)}
          multiline
        />
      </div>

      <SignatureBlock
        signers={[
          { label: `${f.contracteeName || "Contratante"}` },
          {
            label: `${f.contractorName || "Kanan Remodelaciones"} · Contratista`,
          },
        ]}
      />
      <DocFooter />
    </div>
  );
}
