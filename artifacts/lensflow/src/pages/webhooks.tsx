import { useState } from "react";
import { useListWebhooks, useCreateWebhook, useDeleteWebhook, getListWebhooksQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Trash2, Webhook, Plus, Code2, CheckCircle2, Circle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

const AVAILABLE_EVENTS = [
  { id: "job.queued", label: "job.queued", description: "A new job is added to the queue" },
  { id: "job.processing", label: "job.processing", description: "A job starts processing" },
  { id: "job.step_complete", label: "job.step_complete", description: "A pipeline step finishes" },
  { id: "job.complete", label: "job.complete", description: "A job completes successfully" },
  { id: "job.failed", label: "job.failed", description: "A job fails" },
];

const formSchema = z.object({
  url: z.string().url("Please enter a valid HTTPS URL"),
  events: z.array(z.string()).min(1, "Select at least one event"),
  secret: z.string().optional(),
});

export default function Webhooks() {
  const { data: webhooks, isLoading } = useListWebhooks();
  const createWebhook = useCreateWebhook();
  const deleteWebhook = useDeleteWebhook();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema as any),
    defaultValues: { url: "", events: ["job.complete", "job.failed"], secret: "" },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    createWebhook.mutate(
      { data: { url: values.url, events: values.events, secret: values.secret || undefined } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListWebhooksQueryKey() });
          toast({ title: "Webhook Registered", description: "Your endpoint will now receive pipeline events." });
          form.reset();
          setShowForm(false);
        },
        onError: () => {
          toast({ title: "Registration Failed", description: "Could not register the webhook.", variant: "destructive" });
        },
      }
    );
  }

  function handleDelete(id: string) {
    deleteWebhook.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListWebhooksQueryKey() });
          toast({ title: "Webhook Removed" });
        },
        onError: () => {
          toast({ title: "Delete Failed", variant: "destructive" });
        },
      }
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Webhook API</h1>
          <p className="text-muted-foreground text-sm">
            Register HTTPS endpoints to receive real-time pipeline event notifications.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setShowForm(v => !v)}
          className="font-mono text-xs uppercase tracking-wider shrink-0"
          data-testid="button-add-webhook"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          {showForm ? "Cancel" : "Add Endpoint"}
        </Button>
      </div>

      {/* Add Webhook Form */}
      {showForm && (
        <div className="bg-card border border-border rounded-lg p-6 relative overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          <h2 className="font-semibold mb-5 text-sm uppercase font-mono tracking-wider text-muted-foreground">Register New Endpoint</h2>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-wider font-mono text-muted-foreground">Endpoint URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://your-server.com/webhooks/lensflow"
                        className="font-mono text-sm bg-background border-border h-10"
                        data-testid="input-webhook-url"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="events"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-wider font-mono text-muted-foreground">Events to Subscribe</FormLabel>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      {AVAILABLE_EVENTS.map((event) => (
                        <label
                          key={event.id}
                          className={`flex items-start gap-3 p-3 rounded border cursor-pointer transition-colors ${
                            field.value.includes(event.id)
                              ? "border-primary/40 bg-primary/5"
                              : "border-border hover:bg-secondary/40"
                          }`}
                        >
                          <Checkbox
                            checked={field.value.includes(event.id)}
                            onCheckedChange={(checked) => {
                              const updated = checked
                                ? [...field.value, event.id]
                                : field.value.filter((e: string) => e !== event.id);
                              field.onChange(updated);
                            }}
                            className="mt-0.5 shrink-0"
                            data-testid={`checkbox-event-${event.id}`}
                          />
                          <div>
                            <div className="text-xs font-mono text-foreground">{event.label}</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">{event.description}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="secret"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-wider font-mono text-muted-foreground">
                      Signing Secret <span className="text-muted-foreground/50">(optional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Used to sign payloads via HMAC-SHA256"
                        className="font-mono text-sm bg-background border-border h-10"
                        data-testid="input-webhook-secret"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={createWebhook.isPending}
                  className="font-mono text-xs uppercase tracking-wider h-10 px-6"
                  data-testid="button-submit-webhook"
                >
                  {createWebhook.isPending ? "Registering..." : "Register Endpoint"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      )}

      {/* Existing Webhooks */}
      <div className="space-y-3">
        <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Registered Endpoints</h2>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="space-y-px">
              {[1, 2].map(i => (
                <div key={i} className="h-20 bg-muted/20 animate-pulse" />
              ))}
            </div>
          ) : !webhooks || webhooks.length === 0 ? (
            <div className="p-10 flex flex-col items-center justify-center gap-3 text-center">
              <Webhook className="w-8 h-8 text-muted-foreground/20" />
              <p className="text-muted-foreground text-sm">No endpoints registered yet.</p>
              <p className="text-xs text-muted-foreground/60">Add an endpoint to receive pipeline event notifications.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {webhooks.map((wh) => (
                <div key={wh.id} className="flex items-start justify-between gap-4 p-4 group" data-testid={`webhook-${wh.id}`}>
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${wh.isActive ? "bg-primary" : "bg-muted-foreground/30"}`} />
                    <div className="min-w-0 space-y-1.5">
                      <div className="font-mono text-sm text-foreground truncate" data-testid={`text-webhook-url-${wh.id}`}>
                        {wh.url}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {wh.events.map((e) => (
                          <span key={e} className="text-[10px] font-mono px-2 py-0.5 rounded bg-secondary border border-border text-muted-foreground">
                            {e}
                          </span>
                        ))}
                      </div>
                      <div className="text-[10px] font-mono text-muted-foreground/50">
                        Added {formatDistanceToNow(new Date(wh.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(wh.id)}
                    disabled={deleteWebhook.isPending}
                    className="shrink-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                    data-testid={`button-delete-webhook-${wh.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* API Docs Panel */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Code2 className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Payload Reference</span>
        </div>
        <div className="p-5 space-y-5">
          <p className="text-xs text-muted-foreground leading-relaxed">
            LensFlow AI sends a signed HTTP POST request to your endpoint for each subscribed event.
            Verify authenticity with the <code className="bg-secondary px-1 py-0.5 rounded text-foreground">X-LensFlow-Signature</code> header.
          </p>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">Example Payload</div>
            <pre className="bg-background border border-border rounded p-4 text-xs font-mono text-foreground overflow-x-auto leading-relaxed">
{`{
  "event": "job.complete",
  "timestamp": "2026-05-31T12:00:00Z",
  "job": {
    "id": "a3f7c2d1-...",
    "listingUrl": "https://domain.com/...",
    "status": "complete",
    "videoUrl": "https://cdn.lensflow.ai/..."
  }
}`}
            </pre>
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">Verification</div>
            <pre className="bg-background border border-border rounded p-4 text-xs font-mono text-foreground overflow-x-auto leading-relaxed">
{`// Verify signature (Node.js)
const crypto = require("crypto");
const sig = req.headers["x-lensflow-signature"];
const expected = crypto
  .createHmac("sha256", YOUR_SECRET)
  .update(JSON.stringify(req.body))
  .digest("hex");
if (sig !== expected) return res.status(401).end();`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
