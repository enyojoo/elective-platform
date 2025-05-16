"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLanguage } from "@/context/language-context"
import { useToast } from "@/hooks/use-toast"
import type { ExchangeUniversity, ExchangeUniversityFormData } from "@/types/exchange-university"
import { createExchangeUniversity, updateExchangeUniversity } from "@/actions/exchange-universities"

interface ExchangeUniversityFormProps {
  university?: ExchangeUniversity
  electivePacks: { id: string; title: string }[]
  countries: { code: string; name: string; name_ru?: string }[]
}

export function ExchangeUniversityForm({ university, electivePacks, countries }: ExchangeUniversityFormProps) {
  const { language, t } = useLanguage()
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const formSchema = z.object({
    institution_id: z.string().uuid(),
    elective_pack_id: z.string().uuid(),
    name: z.string().min(1, t("name_required")),
    name_ru: z.string().optional(),
    country: z.string().min(1, t("country_required")),
    city: z.string().min(1, t("city_required")),
    description: z.string().optional(),
    description_ru: z.string().optional(),
    language: z.string().optional(),
    max_students: z.number().int().min(1, t("max_students_positive")),
    website_url: z.string().url().optional().or(z.literal("")),
    logo_url: z.string().url().optional().or(z.literal("")),
    status: z.enum(["active", "inactive"]),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: university
      ? {
          ...university,
          max_students: university.max_students || 3,
        }
      : {
          institution_id: "", // This would be set from the user's context
          elective_pack_id: "",
          name: "",
          name_ru: "",
          country: "",
          city: "",
          description: "",
          description_ru: "",
          language: "",
          max_students: 3,
          website_url: "",
          logo_url: "",
          status: "active",
        },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)
    try {
      if (university) {
        await updateExchangeUniversity(university.id, values)
        toast({
          title: t("success"),
          description: t("university_updated"),
        })
      } else {
        await createExchangeUniversity(values as ExchangeUniversityFormData)
        toast({
          title: t("success"),
          description: t("university_created"),
        })
      }
      router.push("/admin/electives/exchange")
    } catch (error) {
      toast({
        title: t("error"),
        description: university ? t("university_update_error") : t("university_create_error"),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{university ? t("edit_university") : t("add_university")}</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="elective_pack_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("elective_pack")}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("select_elective_pack")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {electivePacks.map((pack) => (
                        <SelectItem key={pack.id} value={pack.id}>
                          {pack.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("name")} (EN)</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name_ru"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("name")} (RU)</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("country")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("select_country")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            {language === "ru" && country.name_ru ? country.name_ru : country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("city")}</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("language")}</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormDescription>{t("language_description")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="max_students"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("max_students")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      {...field}
                      onChange={(e) => field.onChange(Number.parseInt(e.target.value))}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>{t("max_students_description")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("description")} (EN)</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={4} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description_ru"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("description")} (RU)</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={4} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="website_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("website_url")}</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="logo_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("logo_url")}</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("status")}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("select_status")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">{t("active")}</SelectItem>
                      <SelectItem value="inactive">{t("inactive")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/electives/exchange")}
              disabled={isSubmitting}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("saving") : university ? t("update") : t("create")}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
