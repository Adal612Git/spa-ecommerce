<template>
  <q-page class="flex flex-center">
    <AuthForm mode="login" @submit="onSubmit" />
  </q-page>
</template>

<script setup lang="ts">
import AuthForm from 'components/AuthForm.vue';
import { useAuthStore } from 'src/stores/auth';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';

const auth = useAuthStore();
const router = useRouter();
const $q = useQuasar();

async function onSubmit({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  try {
    await auth.login(email, password);
    await router.push('/');
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Error al iniciar sesión: ' + (error as Error).message,
    });
  }
}
</script>

