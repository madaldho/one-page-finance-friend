
-- Create asset value history table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.asset_value_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
    value DECIMAL(15,2) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.asset_value_history ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to select their own asset value history
CREATE POLICY "Users can view their own asset value history" 
    ON public.asset_value_history 
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own asset value history
CREATE POLICY "Users can insert their own asset value history" 
    ON public.asset_value_history 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own asset value history
CREATE POLICY "Users can update their own asset value history" 
    ON public.asset_value_history 
    FOR UPDATE 
    USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own asset value history
CREATE POLICY "Users can delete their own asset value history" 
    ON public.asset_value_history 
    FOR DELETE 
    USING (auth.uid() = user_id);

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_asset_value_history_updated_at ON asset_value_history;
CREATE TRIGGER update_asset_value_history_updated_at
BEFORE UPDATE ON asset_value_history
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
