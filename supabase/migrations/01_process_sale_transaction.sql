-- Process Sale Transaction RPC (Updated for gen_random_uuid)
create or replace function process_sale_transaction(
  p_invoice_number text,
  p_customer_id uuid, -- Can be null for anonymous sales
  p_supplier_id uuid, -- For purchases
  p_total numeric,
  p_paid numeric,
  p_items jsonb, -- Array of {product_id, quantity, price, cost}
  p_user_id uuid,
  p_type text default 'sale', -- 'sale', 'purchase', 'return_sale', 'return_purchase'
  p_status text default 'completed',
  p_payment_method text default 'cash'
) returns uuid as $$
declare
  v_invoice_id uuid;
  v_item jsonb;
  v_qty numeric;
begin
  -- 1. Create Invoice Header
  insert into invoices (
    invoice_number, 
    customer_id, 
    supplier_id,
    total, 
    paid, 
    type, 
    status, 
    payment_method, 
    created_by, 
    created_at
  ) values (
    p_invoice_number, 
    p_customer_id, 
    p_supplier_id,
    p_total, 
    p_paid, 
    p_type::public.invoice_type, 
    p_status::public.invoice_status, 
    p_payment_method::public.payment_method, 
    p_user_id, 
    now()
  ) returning id into v_invoice_id;

  -- 2. Process Items
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := (v_item->>'quantity')::numeric;

    -- Insert Invoice Item
    insert into invoice_items (
      invoice_id, product_id, product_name, quantity, price, cost, total
    ) values (
      v_invoice_id,
      (v_item->>'product_id')::uuid,
      v_item->>'product_name',
      v_qty,
      (v_item->>'price')::numeric,
      (v_item->>'cost')::numeric,
      (v_qty * (v_item->>'price')::numeric)
    );

    -- Update Product Stock & Average Cost
    if p_status = 'completed' then
      if p_type = 'sale' then
         -- Decrease stock
         update products 
         set quantity = quantity - v_qty
         where id = (v_item->>'product_id')::uuid;

      elsif p_type = 'purchase' then
         -- Increase stock & update cost price
         update products 
         set quantity = quantity + v_qty,
             cost_price = (v_item->>'price')::numeric 
         where id = (v_item->>'product_id')::uuid;

      elsif p_type = 'return_sale' then
         -- Return to stock
         update products 
         set quantity = quantity + v_qty
         where id = (v_item->>'product_id')::uuid;

      elsif p_type = 'return_purchase' then
         -- Return to supplier (decrease stock)
         update products 
         set quantity = quantity - v_qty
         where id = (v_item->>'product_id')::uuid;
      end if;
    end if;
  end loop;

  -- 3. Update Balances (Debt)
  if p_status = 'completed' then
      -- Customer Debt (Sale)
      if p_customer_id is not null and p_type = 'sale' and (p_total - p_paid) > 0 then
        update customers
        set 
          balance = coalesce(balance, 0) + (p_total - p_paid),
          total_purchases = coalesce(total_purchases, 0) + p_total,
          updated_at = now()
        where id = p_customer_id;
      end if;

      -- Supplier Debt (Purchase)
      if p_supplier_id is not null and p_type = 'purchase' and (p_total - p_paid) > 0 then
        update suppliers
        set 
          balance = coalesce(balance, 0) + (p_total - p_paid),
          total_purchases = coalesce(total_purchases, 0) + p_total,
          updated_at = now()
        where id = p_supplier_id;
      end if;
  end if;
  
  -- 4. Create Notification
  insert into notifications (user_id, title, message, type)
  values (
    p_user_id, 
    case when p_type = 'sale' then 'عملية بيع جديدة' else 'عملية شراء جديدة' end, 
    'تم إنشاء الفاتورة رقم ' || p_invoice_number || ' بقيمة ' || p_total, 
    'success'
  );

  return v_invoice_id;
end;
$$ language plpgsql security definer;
