import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router"
import { Theme } from "@radix-ui/themes"
import "@radix-ui/themes/styles.css"
import appCss from "../styles.css?url"
import { useDarkMode } from "../hooks/useDarkMode"
import { Toaster } from "../components/Toaster"

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const { dark } = useDarkMode()
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <Theme
          appearance={dark ? "dark" : "light"}
          grayColor="slate"
          radius="medium"
          panelBackground="solid"
        >
          {children}
          <Toaster />
        </Theme>
        <Scripts />
      </body>
    </html>
  )
}
