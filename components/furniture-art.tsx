import type { FurnitureType } from "@/lib/production";

export default function FurnitureArt({ type = "mesa", large = false }: { type?: FurnitureType; large?: boolean }) {
  return <svg viewBox="0 0 260 200" role="img" aria-label={"Ilustração de " + ({mesa:"mesa",armario:"armário",estante:"estante",banco:"banco"}[type])} className={large ? "furniture-art large" : "furniture-art"}>
    <ellipse cx="130" cy="174" rx="99" ry="13" fill="#694a30" opacity=".10"/>
    {type === "mesa" && <g>
      <path d="M49 100 58 102 59 172 49 167Z" fill="#795332"/><path d="M198 98 208 91 204 158 195 165Z" fill="#795332"/>
      <path d="M104 126 117 129 117 181 104 177Z" fill="#68462c"/><path d="M162 122 174 115 175 175 162 181Z" fill="#8b6040"/>
      <path d="M29 91 129 52 233 85 133 130Z" fill="#ce9c66"/><path d="M29 91 133 130 133 142 29 103Z" fill="#ae7848"/><path d="M133 130 233 85 233 98 133 142Z" fill="#835936"/>
      <path d="M49 90 145 60M83 101 177 72M114 114 206 83" stroke="#e8be8f" strokeWidth="2" opacity=".7"/>
      {large && <g><path d="m151 73 20-8 22 7-20 9z" fill="#fcf8ef"/><path d="m158 74 14-5 10 3" fill="none" stroke="#8ba59f" strokeWidth="1.4"/><path d="m75 82 20-8 4 2-20 8z" fill="#ff6b36"/></g>}
    </g>}
    {type === "banco" && <g>
      <path d="m60 116 13 3-1 49-13-4zM170 105 13-5v51l-13 5z" fill="#805733"/>
      <path d="m37 101 102-31 85 26-107 37z" fill="#c99b64"/><path d="m37 101 80 32v14l-80-31z" fill="#a47045"/><path d="m117 133 107-37v14l-107 37z" fill="#855b37"/>
      <path d="m116 146 12-4v36l-12 5z" fill="#865b39"/><path d="m77 101 95-27" stroke="#e5bd8c" strokeWidth="3"/>
    </g>}
    {(type === "armario" || type === "estante") && <g>
      <path d="m62 41 105-18 48 22-102 22z" fill="#d5ac7d"/><path d="m62 41 51 26v112l-51-25z" fill="#a2764d"/><path d="m113 67 102-22v112l-102 22z" fill="#c09361"/>
      <path d="m66 157 11 5v13l-11-4zm124 5 11-3v13l-11 4z" fill="#65472f"/>
      {type === "armario" ? <g><path d="m165 56v111" stroke="#855e3c" strokeWidth="2"/><path d="m151 108 1 16m26-22 1 16" stroke="#f7e8d5" strokeWidth="4" strokeLinecap="round"/></g> : <g>
        <path d="m121 76 86-19v28l-86 19zm0 40 86-19v26l-86 19zm0 39 86-19v24l-86 19z" fill="#6f5137"/>
        <path d="m124 103 80-17m-80 55 80-17" stroke="#e1b680" strokeWidth="5"/>
        <path d="m133 91 6-1v11l-6 1zm8-7 6-1v16l-6 1zm9-1 9-2v16l-9 2z" fill="#648e80"/><path d="m182 110 15-3v16l-15 3z" fill="#e2b582"/>
      </g>}
    </g>}
  </svg>;
}
