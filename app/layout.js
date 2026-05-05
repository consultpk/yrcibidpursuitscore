import './globals.css'

export const metadata = {
  title: 'YRCI Bid Pursuit Scorecard',
  description: 'Rate each factor to calculate your pursuit value and decide whether to bid.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
