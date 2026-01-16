-- دالة لتحديث بيانات المستخدم (كلمة المرور، الصلاحيات، الدور)
create or replace function public.update_user_details(
  target_user_id uuid,
  new_password text default null,
  new_full_name text default null,
  new_role public.user_role default null,
  new_permissions text[] default null,
  new_is_active boolean default null
)
returns void
language plpgsql
security definer
as $$
begin
  -- 1. تحديث كلمة المرور (إذا تم تقديمها)
  if new_password is not null and length(new_password) >= 6 then
    update auth.users
    set encrypted_password = crypt(new_password, gen_salt('bf')),
        updated_at = now()
    where id = target_user_id;
  end if;

  -- 2. تحديث البيانات في Profiles (الاسم، الدور، الصلاحيات، الحالة)
  update public.profiles
  set 
    full_name = coalesce(new_full_name, full_name),
    role = coalesce(new_role, role),
    permissions = coalesce(new_permissions, permissions),
    is_active = coalesce(new_is_active, is_active),
    updated_at = now()
  where user_id = target_user_id;

  -- 3. تحديث البيانات الوصفية (Metadata) في Auth للحفاظ على التزامن
  if new_full_name is not null or new_role is not null then
    update auth.users
    set raw_user_meta_data = 
      raw_user_meta_data || 
      jsonb_build_object(
        'full_name', coalesce(new_full_name, raw_user_meta_data->>'full_name'),
        'role', coalesce(new_role::text, raw_user_meta_data->>'role')
      )
    where id = target_user_id;
  end if;
end;
$$;
