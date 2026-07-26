"use client"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { useChat } from "@ai-sdk/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Loader2, Plus, FileText, Globe, Video, Send, File, Info } from "lucide-react"
import {
  PromptInput,
  PromptInputFooter,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input"

export default function NotebookPage() {
  const params = useParams()
  const notebookId = params?.id as string

  const [notebook, setNotebook] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [sourceType, setSourceType] = useState('pdf')
  const [sourceName, setSourceName] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [sourceFile, setSourceFile] = useState<File | null>(null)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  
  const { messages, input, handleInputChange, append, setInput, isLoading } = useChat({
    api: '/api/chat',
    body: { notebookId }
  })

  useEffect(() => {
    fetch(`/api/notebooks/${notebookId}`)
      .then(res => res.json())
      .then(data => {
        setNotebook(data)
        setLoading(false)
      })
  }, [notebookId])

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)
    const formData = new FormData()
    formData.append('notebookId', notebookId)

    formData.append('type', sourceType)
    formData.append('name', sourceName)
    if (sourceUrl) formData.append('url', sourceUrl)
    if (sourceFile) formData.append('file', sourceFile)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      if (res.ok) {
        setUploadDialogOpen(false)
        // refresh notebook
        const freshData = await fetch(`/api/notebooks/${notebookId}`).then(r => r.json())
        setNotebook(freshData)
      }
    } finally {
      setUploading(false)
    }
  }

  if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin" /></div>
  
  if (notebook?.error) return <div className="p-8">Notebook not found.</div>

  return (
    <ResizablePanelGroup direction="horizontal" className="h-full border-t border-border">
      {/* Chat Area */}
      <ResizablePanel defaultSize={60} minSize={30}>
        <div className="flex flex-col h-full bg-card">
          <div className="p-4 border-b border-border flex justify-between items-center bg-background/50 backdrop-blur-sm">
            <h1 className="font-semibold">{notebook.name}</h1>
          </div>
          
          <div className="flex-1 overflow-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                <Info className="h-12 w-12 mb-4 opacity-20" />
                <p>Ask anything about your sources.</p>
              </div>
            ) : (
              messages.map(m => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    m.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-foreground'
                  }`}>
                    {/* Basic Markdown rendering for citations. Better would be react-markdown. */}
                    <div className="whitespace-pre-wrap">{m.content}</div>
                  </div>
                </div>
              ))
            )}
            {isLoading && <div className="text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Thinking...</div>}
          </div>

          <div className="p-4 bg-background">
            <PromptInput
              onSubmit={(_, e) => {
                e?.preventDefault();
                if (input.trim() && !isLoading) {
                  const content = input;
                  setInput('');
                  append({ role: 'user', content });
                }
              }}
              className="border border-border rounded-xl shadow-sm bg-background p-2 focus-within:ring-1 focus-within:ring-primary"
            >
              <PromptInputTextarea
                value={input}
                onChange={handleInputChange}
                placeholder="Ask about your sources..."
                className="min-h-[60px] resize-none shadow-none focus-visible:ring-0 border-none bg-transparent w-full"
              />
              <PromptInputFooter className="pt-2 flex justify-end items-center w-full">
                <Button type="submit" size="sm" className="rounded-full px-4" disabled={!input || input.trim() === ''}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                  Send
                </Button>
              </PromptInputFooter>
            </PromptInput>
          </div>
        </div>
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* Sources Area */}
      <ResizablePanel defaultSize={40} minSize={20}>
        <div className="flex flex-col h-full bg-background border-l border-border">
          <div className="p-4 border-b border-border flex justify-between items-center">
            <h2 className="font-semibold text-sm">Knowledge Sources</h2>
            <Button size="sm" variant="outline" onClick={() => setUploadDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2"/> Add Source
            </Button>
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Knowledge Source</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleUpload} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Source Type</Label>
                    <Select value={sourceType} onValueChange={setSourceType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF Document</SelectItem>
                        <SelectItem value="text">Plain Text</SelectItem>
                        <SelectItem value="url">Website URL</SelectItem>
                        <SelectItem value="youtube">YouTube Video</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Source Name</Label>
                    <Input value={sourceName} onChange={e => setSourceName(e.target.value)} required placeholder="My Document" />
                  </div>

                  {(sourceType === 'url' || sourceType === 'youtube') && (
                    <div className="space-y-2">
                      <Label>URL</Label>
                      <Input type="url" value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} required placeholder="https://..." />
                    </div>
                  )}

                  {(sourceType === 'pdf' || sourceType === 'text') && (
                    <div className="space-y-2">
                      <Label>File</Label>
                      <Input type="file" onChange={e => setSourceFile(e.target.files?.[0] || null)} required accept={sourceType === 'pdf' ? '.pdf' : '.txt'} />
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={uploading}>
                    {uploading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                    Upload & Index
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="flex-1 overflow-auto p-4 space-y-2">
            {notebook.sources?.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground mt-10">No sources added yet.</div>
            ) : (
              notebook.sources?.map((source: any) => (
                <div key={source.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent cursor-pointer transition-colors">
                  <div className="p-2 rounded-md bg-primary/10 text-primary">
                    {source.type === 'pdf' ? <FileText className="h-4 w-4" /> : 
                     source.type === 'url' ? <Globe className="h-4 w-4" /> : 
                     source.type === 'youtube' ? <Video className="h-4 w-4" /> : 
                     <File className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{source.name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                       <span className="capitalize">{source.type}</span> • 
                       <span className={source.status === 'ready' ? 'text-green-500' : 'text-yellow-500'}>{source.status}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
