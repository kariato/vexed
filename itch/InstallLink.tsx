// SPDX-License-Identifier: GPL-2.0-or-later
// itch.io-only replacement: no worker, installation prompt or update UI in the iframe.
export function Offline(_props: { canUpdate: boolean; totalPuzzles: number }) {
  return <div className="offline-status">
    <h3>Install for offline play</h3>
    <p><a href="https://kariato.github.io/vexed/" target="_blank" rel="noopener noreferrer">Open the installable Vexed app ↗</a></p>
    <p>Open the link in your browser, then use Install app or Share → Add to Home Screen. The full web app supports offline play.</p>
    <p>Progress here is saved separately from the installable app and does not sync between them.</p>
    <p><a href="./vexed-source.zip">Download application source &amp; license</a></p>
  </div>
}
