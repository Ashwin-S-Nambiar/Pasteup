export default function SiteFooter({ className = '' }) {
  return (
    <footer
      className={`on-mat flex justify-center gap-4 text-on-mat text-xs md:justify-between ${className}`}
    >
      <span>
        Templates from{' '}
        <a
          className="text-paper underline underline-offset-2"
          href="https://imgflip.com/memetemplates"
          target="_blank"
          rel="noreferrer"
        >
          Imgflip
        </a>
      </span>
      <span>
        Made by{' '}
        <a
          className="text-paper underline underline-offset-2"
          href="https://ashwin.co.in"
          target="_blank"
          rel="noreferrer"
        >
          Ashwin
        </a>
      </span>
    </footer>
  );
}
