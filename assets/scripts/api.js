const supabaseUrl = 'https://dfcdgixjuurgzutkunlo.supabase.co';
const supabaseKey = 'sb_publishable_EYj-hVxfm6iihvDKcH8VKA_C-Uym2GY';

window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

window.loginAdmin = async function (email, password) {
    const { data, error } = await window.supabaseClient.auth.signInWithPassword({
        email: email,
        password: password,
    });
    return { data, error };
}

window.resetAdminPassword = async function (email) {
    const { data, error } = await window.supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/admin.html',
    });
    return { data, error };
}