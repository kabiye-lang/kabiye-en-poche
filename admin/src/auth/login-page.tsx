import { Form, required, useLogin, useNotify } from 'ra-core'

import { RaInput } from '@/components/ra-input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function LoginPage({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const login = useLogin()
  const notify = useNotify()

  const handleSubmit = (values: Record<string, unknown>) => {
    login(values as { email: string; password: string }).catch((error: Error) => {
      const message = error?.message || 'Invalid email or password'
      notify(message, { type: 'error' })
    })
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className={cn('flex flex-col gap-6', className)} {...props}>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Login</CardTitle>
              <CardDescription>Enter your email below to login to the Kabiyè en Poche admin panel</CardDescription>
            </CardHeader>
            <CardContent>
              <Form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                <RaInput label="Email" source="email" type="email" validate={required()} />
                <RaInput label="Password" source="password" type="password" validate={required()} />
                <Button type="submit">Sign in</Button>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
