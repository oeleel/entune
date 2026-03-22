-- Allow doctors to delete their own visits
create policy "Users can delete own visits"
  on visits for delete
  using (auth.uid() = user_id);
