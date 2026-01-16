-- Create a function to handle the complete sale transaction atomically
create or replace function process_sale_transaction(
  p_invoice_number text,
  p_customer_id uuid,
  p_total numeric,
  p_paid numeric,
  p_items jsonb, -- Array of {product_id, quantity, price, cost}
  p_user_id uuid,
  p_type text default 'sale', -- 'sale' or 'return'
  p_status text default 'completed',
  p_payment_method text default 'cash'
) returns uuid as $$
declare
  v_invoice_id uuid;
  v_item jsonb;
  v_product_qty numeric;
  v_new_stock numeric;
  v_client_balance numeric;
begin
  -- 1. Create Invoice Header
  insert into invoices (
    invoice_number, customer_id, total, paid, remaining, type, status, payment_method, created_by, created_at
  ) values (
    p_invoice_number, 
    p_customer_id, 
    p_total, 
    p_paid, 
    p_total - p_paid, 
    p_type, 
    p_status, 
    p_payment_method, 
    p_user_id, 
    now()
  ) returning id into v_invoice_id;

  -- 2. Process Items (Insert Invoice Items & Update Stock)
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    -- Insert Invoice Item
    insert into invoice_items (
      invoice_id, product_id, product_name, quantity, price, total
    ) values (
      v_invoice_id,
      (v_item->>'product_id')::uuid,
      v_item->>'product_name',
      (v_item->>'quantity')::numeric,
      (v_item->>'price')::numeric,
      ((v_item->>'quantity')::numeric * (v_item->>'price')::numeric)
    );

    -- Update Product Stock
    if p_status = 'completed' then
      if p_type = 'sale' then
         update products 
         set stock_qty = stock_qty - (v_item->>'quantity')::numeric
         where id = (v_item->>'product_id')::uuid;
      elsif p_type = 'return' then
         update products 
         set stock_qty = stock_qty + (v_item->>'quantity')::numeric
         where id = (v_item->>'product_id')::uuid;
      end if;
    end if;
  end loop;

  -- 3. Update Customer Balance (if credit sale)
  if p_customer_id is not null and (p_total - p_paid) > 0 and p_status = 'completed' then
    update customers
    set 
      balance = coalesce(balance, 0) + (p_total - p_paid),
      total_purchases = coalesce(total_purchases, 0) + p_total,
      updated_at = now()
    where id = p_customer_id;
  end if;
  
  -- 4. Create Notification
  insert into notifications (user_id, title, message, type)
  values (
    p_user_id, 
    'عملية بيع جديدة', 
    'تم إنشاء الفاتورة رقم ' || p_invoice_number || ' بقيمة ' || p_total, 
    'success'
  );

  return v_invoice_id;
end;
$$ language plpgsql security definer;
