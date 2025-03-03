<script setup lang="ts">
import { events, isEnabled } from 'vite-plugin-vue-tracer/client/listeners'
import { ref } from 'vue'
import Button from './components/ui/Button.vue'
import Checkbox from './components/ui/Checkbox.vue'
import Grid from './components/ui/Grid.vue'
import Input from './components/ui/Input.vue'

const email = ref('')
const name = ref('')
const age = ref('')
const newsletter = ref(false)
const loading = ref(false)

function handleSubmit() {
  loading.value = true
  setTimeout(() => {
    loading.value = false
  }, 2000)
}

function startTrace() {
  isEnabled.value = true
}

events.on('click', (e: any) => {
  // eslint-disable-next-line no-console
  console.log('click', e)
  isEnabled.value = false
})
</script>

<template>
  <Button size="lg" fixed left-5 top-5 @click="startTrace">
    Start Trace
  </Button>

  <main class="min-h-screen bg-gray-50 p-8 dark:bg-gray-900">
    <div class="mx-auto max-w-7xl space-y-12">
      <section class="space-y-6">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
          Buttons
        </h2>
        <Grid :columns="3" gap="md">
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300">
              Primary
            </h3>
            <div class="space-y-2">
              <Button size="sm">
                Small
              </Button>
              <Button>Medium</Button>
              <Button size="lg">
                Large
              </Button>
              <Button loading>
                Loading
              </Button>
              <Button disabled>
                Disabled
              </Button>
            </div>
          </div>
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300">
              Secondary
            </h3>
            <div class="space-y-2">
              <Button variant="secondary" size="sm">
                Small
              </Button>
              <Button variant="secondary">
                Medium
              </Button>
              <Button variant="secondary" size="lg">
                Large
              </Button>
              <Button variant="secondary" loading>
                Loading
              </Button>
              <Button variant="secondary" disabled>
                Disabled
              </Button>
            </div>
          </div>
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300">
              Outline
            </h3>
            <div class="space-y-2">
              <Button variant="outline" size="sm">
                Small
              </Button>
              <Button variant="outline">
                Medium
              </Button>
              <Button variant="outline" size="lg">
                Large
              </Button>
              <Button variant="outline" loading>
                Loading
              </Button>
              <Button variant="outline" disabled>
                Disabled
              </Button>
            </div>
          </div>
        </Grid>
      </section>

      <section class="space-y-6">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
          Form Components
        </h2>
        <form class="max-w-md space-y-6" @submit.prevent="handleSubmit">
          <Input
            v-model="email"
            type="email"
            label="Email"
            placeholder="Enter your email"
          />
          <Input
            v-model="name"
            label="Name"
            placeholder="Enter your name"
          />
          <Input
            v-model="age"
            type="number"
            label="Age"
            placeholder="Enter your age"
          />
          <Checkbox
            v-model="newsletter"
            label="Subscribe to newsletter"
          />
          <Button type="submit" :loading="loading">
            Submit
          </Button>
        </form>
      </section>

      <section class="space-y-6">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
          Grid Layout
        </h2>
        <div class="space-y-8">
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300">
              2 Columns
            </h3>
            <Grid :columns="2" gap="md">
              <div v-for="n in 4" :key="n" class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
                <h4 class="text-lg font-medium text-gray-900 dark:text-white">
                  Card {{ n }}
                </h4>
                <p class="mt-2 text-gray-600 dark:text-gray-300">
                  This is a sample card in a 2-column grid layout.
                </p>
              </div>
            </Grid>
          </div>

          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300">
              3 Columns
            </h3>
            <Grid :columns="3" gap="md">
              <div v-for="n in 6" :key="n" class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
                <h4 class="text-lg font-medium text-gray-900 dark:text-white">
                  Card {{ n }}
                </h4>
                <p class="mt-2 text-gray-600 dark:text-gray-300">
                  This is a sample card in a 3-column grid layout.
                </p>
              </div>
            </Grid>
          </div>

          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300">
              4 Columns
            </h3>
            <Grid :columns="4" gap="md">
              <div v-for="n in 8" :key="n" class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
                <h4 class="text-lg font-medium text-gray-900 dark:text-white">
                  Card {{ n }}
                </h4>
                <p class="mt-2 text-gray-600 dark:text-gray-300">
                  This is a sample card in a 4-column grid layout.
                </p>
              </div>
            </Grid>
          </div>
        </div>
      </section>
    </div>
  </main>
</template>
