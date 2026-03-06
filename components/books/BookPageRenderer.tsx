interface Page {
  type: "text" | "illustration" | "coloring" | "mixed";
  content?: string;
  text?: any;
  image?: string;
  meta?: any;
}

export default function BookPageRenderer({ page }: { page: Page }) {
  if (page.type === "text") {
    return (
      <p style={{ fontSize: 20, lineHeight: 1.6, whiteSpace: "pre-line" }}>
        {page.text?.en || page.content}
      </p>
    );
  }

  if (page.type === "illustration") {
    return (
      <div className="imageWrapper">
        <img src={page.image} alt="" className="pageImage" />
      </div>
    );
  }

  if (page.type === "coloring") {
    return (
      <div className="imageWrapper">
        <img src={page.image} alt="" className="pageImage" />
      </div>
    );
  }

  if (page.type === "mixed") {
    return (
      <div className="mixedWrapper">
        {page.content && <p>{page.content}</p>}
        {page.image && (
          <div className="imageWrapper">
            <img src={page.image} alt="" className="pageImage" />
          </div>
        )}
      </div>
    );
  }

  return null;
}

