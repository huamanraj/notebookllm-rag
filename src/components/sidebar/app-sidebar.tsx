import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter } from "@/components/ui/sidebar"
import { useNotebookStore } from "@/store/notebook-store"
import { Book, Plus, Loader2 } from "lucide-react"
import { UserButton } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export function AppSidebar() {
  const { notebooks, activeNotebookId, setNotebooks } = useNotebookStore()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // Fetch notebooks on mount
  useEffect(() => {
    fetch('/api/notebooks')
      .then(async res => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) setNotebooks(data)
      })
      .catch(console.error)
  }, [setNotebooks])

  const handleCreateNotebook = async () => {
    const name = window.prompt("Enter notebook name:", "New Notebook")
    if (!name || name.trim() === '') return;

    setLoading(true)
    try {
      const res = await fetch('/api/notebooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() })
      })
      if (!res.ok) {
        throw new Error(await res.text())
      }
      const newNotebook = await res.json()
      useNotebookStore.getState().addNotebook(newNotebook)
      router.push(`/n/${newNotebook.id}`)
    } catch (err: any) {
      console.error(err)
      alert("Database error: Please check your Postgres connection and ensure you've pushed the schema. Error: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b border-border">
        <h2 className="text-xl font-bold tracking-tight">ChaiBook</h2>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Notebooks</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {notebooks.map((notebook) => (
                <SidebarMenuItem key={notebook.id}>
                  <SidebarMenuButton 
                    isActive={activeNotebookId === notebook.id}
                    onClick={() => router.push(`/n/${notebook.id}`)}
                  >
                    <Book className="mr-2 h-4 w-4" />
                    <span>{notebook.name}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleCreateNotebook} disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                  <span>New Notebook</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 flex items-center justify-between">
         <span className="text-sm font-medium">Account</span>
         <UserButton afterSignOutUrl="/" />
      </SidebarFooter>
    </Sidebar>
  )
}
