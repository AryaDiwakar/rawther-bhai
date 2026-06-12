"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  MessageSquare,
  Send,
  Users,
  CheckCheck,
  Copy,
  ExternalLink,
  Loader2,
  Search,
  Smartphone,
  Sparkles,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"

interface Customer {
  id: string
  name: string
  phone: string
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export default function WhatsAppPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [sentLinks, setSentLinks] = useState<{ name: string; phone: string; link: string }[]>([])

  useEffect(() => {
    fetch("/api/customers?pageSize=1000")
      .then((r) => r.json())
      .then((data) => {
        const list = data.data?.customers || data || []
        setCustomers(list)
      })
      .catch(() => toast.error("Failed to load customers"))
      .finally(() => setLoading(false))
  }, [])

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  )

  const selectAll = selectedIds.size === filtered.length && filtered.length > 0
  const someSelected = selectedIds.size > 0 && !selectAll

  function toggleAll() {
    if (selectAll) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map((c) => c.id)))
    }
  }

  function toggleOne(id: string) {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const selectedCustomers = customers.filter((c) => selectedIds.has(c.id))

  function personalizedText(name: string) {
    return message.replace(/\{name\}/g, name)
  }

  function waLink(phone: string, text: string) {
    const cleaned = phone.replace(/\D/g, "")
    return `https://wa.me/91${cleaned}?text=${encodeURIComponent(text)}`
  }

  function handleSendAll() {
    if (!message.trim()) {
      toast.error("Please type a message")
      return
    }
    if (selectedCustomers.length === 0) {
      toast.error("Select at least one customer")
      return
    }

    setSending(true)
    const links = selectedCustomers.map((c) => ({
      name: c.name,
      phone: c.phone,
      link: waLink(c.phone, personalizedText(c.name)),
    }))
    setSentLinks(links)
    setSending(false)
    toast.success(`Generated ${links.length} WhatsApp links`)
  }

  function copyAll() {
    const text = sentLinks
      .map((l) => `${l.name}: ${l.link}`)
      .join("\n")
    navigator.clipboard.writeText(text)
    toast.success("Copied all links")
  }

  function openFirst() {
    if (sentLinks.length > 0) {
      window.open(sentLinks[0].link, "_blank")
    }
  }

  const charCount = message.length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            WhatsApp Broadcast
          </h1>
          <p className="text-sm text-muted-foreground">
            Send bulk WhatsApp messages to your customers
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <MessageSquare className="size-4 text-emerald-500" />
                Compose Message
              </CardTitle>
              <CardDescription>
                Use {"{name}"} to personalize the message for each customer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Type your message here... e.g. Hi {name}, thanks for visiting Rawther Biryani! 🎉"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[160px] resize-y"
              />
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>{charCount} characters</span>
                <div className="flex gap-3">
                  <button
                    type="button"
                    className="hover:text-foreground transition-colors"
                    onClick={() =>
                      setMessage((prev) => prev + "{name}")
                    }
                  >
                    + {"{name}"}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="size-4 text-primary" />
                Select Customers
                {selectedIds.size > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {selectedIds.size} selected
                  </Badge>
                )}
              </CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search customers..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-8 text-sm"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-4 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <Users className="size-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {search ? "No customers match your search" : "No customers yet"}
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 px-4 py-2 border-b">
                    <Checkbox
                      checked={selectAll}
                      onCheckedChange={toggleAll}
                      className={someSelected ? "data-[state=checked]:bg-primary/50" : ""}
                    />
                    <span className="text-xs font-medium text-muted-foreground">
                      {selectAll ? "Deselect All" : "Select All"}
                    </span>
                  </div>
                  <ScrollArea className="h-[300px]">
                    {filtered.map((customer) => (
                      <label
                        key={customer.id}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 cursor-pointer transition-colors border-b last:border-0"
                      >
                        <Checkbox
                          checked={selectedIds.has(customer.id)}
                          onCheckedChange={() => toggleOne(customer.id)}
                        />
                        <Avatar className="size-8">
                          <AvatarFallback className="text-xs">
                            {getInitials(customer.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {customer.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {customer.phone}
                          </p>
                        </div>
                      </label>
                    ))}
                  </ScrollArea>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Smartphone className="size-4 text-emerald-500" />
                Preview
              </CardTitle>
              <CardDescription>
                See how the message looks for each customer
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!message.trim() ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  Type a message to see preview
                </div>
              ) : selectedCustomers.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  Select customers to see preview
                </div>
              ) : (
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {selectedCustomers.slice(0, 10).map((c) => (
                      <div
                        key={c.id}
                        className="rounded-lg bg-muted/50 p-3 border"
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <Avatar className="size-6">
                            <AvatarFallback className="text-[10px]">
                              {getInitials(c.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-medium">{c.name}</span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap rounded-lg bg-emerald-50 dark:bg-emerald-950/50 p-2.5 border border-emerald-200 dark:border-emerald-900">
                          {personalizedText(c.name)}
                        </p>
                      </div>
                    ))}
                    {selectedCustomers.length > 10 && (
                      <p className="text-xs text-center text-muted-foreground">
                        +{selectedCustomers.length - 10} more
                      </p>
                    )}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-3">
              <Button
                className="w-full h-11 text-base font-semibold"
                onClick={handleSendAll}
                disabled={sending || !message.trim() || selectedCustomers.length === 0}
              >
                {sending ? (
                  <Loader2 className="size-5 mr-2 animate-spin" />
                ) : (
                  <Send className="size-5 mr-2" />
                )}
                Generate WhatsApp Links
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Opens WhatsApp Web with pre-filled messages
              </p>
            </CardContent>
          </Card>

          {sentLinks.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CheckCheck className="size-4 text-emerald-500" />
                    Ready to Send ({sentLinks.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={openFirst}
                    >
                      <ExternalLink className="size-4 mr-1" />
                      Open First
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={copyAll}
                    >
                      <Copy className="size-4 mr-1" />
                      Copy All
                    </Button>
                  </div>
                  <Separator />
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {sentLinks.map((l, i) => (
                        <a
                          key={i}
                          href={l.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between rounded-lg border p-2.5 hover:bg-muted/50 transition-colors group"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">
                              {l.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {l.phone}
                            </p>
                          </div>
                          <ExternalLink className="size-4 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
