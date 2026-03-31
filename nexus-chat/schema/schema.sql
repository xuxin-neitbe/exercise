-- =====================================================
-- Nexus Chat Database Schema
-- Platform: Supabase (PostgreSQL)
-- Version: 1.2.0
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CUSTOM ENUM TYPES
-- =====================================================
CREATE TYPE public.conversation_type AS ENUM ('private', 'group');
CREATE TYPE public.member_role AS ENUM ('admin', 'member', 'owner');

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.users IS 'Public user profiles, linked to Supabase auth.';
COMMENT ON COLUMN public.users.id IS 'References the user ID from auth.users.';

-- =====================================================
-- FRIENDSHIPS TABLE (好友关系表)
-- =====================================================
CREATE TABLE public.friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE (user_id, friend_id),
    CHECK (user_id != friend_id)
);

COMMENT ON TABLE public.friendships IS '好友关系表，单向关系，A添加B后A可发消息给B';

CREATE INDEX idx_friendships_user ON public.friendships(user_id);
CREATE INDEX idx_friendships_friend ON public.friendships(friend_id);

-- =====================================================
-- CONVERSATIONS TABLE
-- =====================================================
CREATE TABLE public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100),
    type public.conversation_type NOT NULL,
    creator_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.conversations IS 'Represents a chat conversation, either private or group.';

CREATE INDEX idx_conversations_type ON public.conversations(type);

-- =====================================================
-- MEMBERS TABLE
-- =====================================================
CREATE TABLE public.members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    role public.member_role DEFAULT 'member' NOT NULL,
    is_muted BOOLEAN DEFAULT false NOT NULL,
    muted_until TIMESTAMPTZ,
    muted_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE (user_id, conversation_id)
);

COMMENT ON TABLE public.members IS 'Links users to conversations, defining their membership and role.';

CREATE INDEX idx_members_conversation ON public.members(conversation_id);
CREATE INDEX idx_members_muted ON public.members(conversation_id, is_muted) WHERE is_muted = true;
CREATE INDEX idx_members_user_role ON public.members(user_id, role);

-- =====================================================
-- MESSAGES TABLE
-- =====================================================
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    status VARCHAR(20) DEFAULT 'sending' NOT NULL CHECK (status IN ('sending', 'sent', 'delivered', 'read', 'failed'))
);

COMMENT ON TABLE public.messages IS 'Stores individual chat messages within a conversation.';

CREATE INDEX idx_messages_conversation_created_at ON public.messages (conversation_id, created_at DESC);
CREATE INDEX idx_messages_user ON public.messages(user_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Users: Allow all users to see other users (public profiles)
CREATE POLICY "Allow all users to see other users"
    ON public.users FOR SELECT
    USING (true);

-- Users: Allow users to update their own profile
CREATE POLICY "Users can update own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id);

-- Users: Allow users to insert their own profile
CREATE POLICY "Users can insert own profile"
    ON public.users FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Friendships: Users can view their own friendships
CREATE POLICY "Users can view their friendships"
    ON public.friendships FOR SELECT
    USING (user_id = auth.uid() OR friend_id = auth.uid());

-- Friendships: Users can create friendships
CREATE POLICY "Users can create friendships"
    ON public.friendships FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Friendships: Users can delete their own friendships
CREATE POLICY "Users can delete their friendships"
    ON public.friendships FOR DELETE
    USING (user_id = auth.uid() OR friend_id = auth.uid());

-- Conversations: Users can only see conversations they are a member of
CREATE POLICY "Users can view conversations they are in"
    ON public.conversations FOR SELECT
    USING (
        id IN (SELECT conversation_id FROM public.members WHERE user_id = auth.uid())
    );

-- Conversations: Users can create conversations
CREATE POLICY "Users can create conversations"
    ON public.conversations FOR INSERT
    WITH CHECK (true);

-- Members: Users can view their own memberships
CREATE POLICY "Users can view their own memberships"
    ON public.members FOR SELECT
    USING (user_id = auth.uid());

-- Members: Users can view other members in conversations they belong to
CREATE POLICY "Users can view other members in their conversations"
    ON public.members FOR SELECT
    USING (
        conversation_id IN (SELECT conversation_id FROM public.members WHERE user_id = auth.uid())
    );

-- Members: Users can insert membership for themselves
CREATE POLICY "Users can insert their own memberships"
    ON public.members FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Members: Users can leave conversations (delete their own membership)
CREATE POLICY "Users can leave conversations"
    ON public.members FOR DELETE
    USING (user_id = auth.uid());

-- Messages: Users can read messages in conversations they are a member of
CREATE POLICY "Users can read messages in their conversations"
    ON public.messages FOR SELECT
    USING (
        conversation_id IN (SELECT conversation_id FROM public.members WHERE user_id = auth.uid())
    );

-- Messages: Users can only send messages if they are not muted
CREATE POLICY "Users can send messages only when not muted"
    ON public.messages FOR INSERT
    WITH CHECK (
        user_id = auth.uid() AND
        conversation_id IN (SELECT conversation_id FROM public.members WHERE user_id = auth.uid()) AND
        NOT public.is_user_muted(auth.uid(), conversation_id)
    );

-- =====================================================
-- FUNCTION: Check if user is muted
-- =====================================================
CREATE OR REPLACE FUNCTION public.is_user_muted(
    p_user_id UUID,
    p_conversation_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_is_muted BOOLEAN := false;
    v_muted_until TIMESTAMPTZ;
BEGIN
    SELECT m.is_muted, m.muted_until
    INTO v_is_muted, v_muted_until
    FROM public.members m
    WHERE m.user_id = p_user_id
      AND m.conversation_id = p_conversation_id;

    IF NOT FOUND THEN
        RETURN false;
    END IF;

    IF v_is_muted THEN
        IF v_muted_until IS NULL THEN
            RETURN true;
        ELSIF v_muted_until > now() THEN
            RETURN true;
        END IF;
    END IF;

    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Send message with mute check
-- =====================================================
CREATE OR REPLACE FUNCTION public.send_message(
    p_content TEXT,
    p_conversation_id UUID,
    p_sender_id UUID DEFAULT auth.uid()
)
RETURNS UUID AS $$
DECLARE
    v_message_id UUID;
BEGIN
    IF public.is_user_muted(p_sender_id, p_conversation_id) THEN
        RAISE EXCEPTION 'You are muted in this conversation';
    END IF;

    INSERT INTO public.messages (content, user_id, conversation_id, status)
    VALUES (p_content, p_sender_id, p_conversation_id, 'sent')
    RETURNING id INTO v_message_id;

    RETURN v_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Mute a member
-- =====================================================
CREATE OR REPLACE FUNCTION public.mute_member(
    p_target_user_id UUID,
    p_conversation_id UUID,
    p_muted_until TIMESTAMPTZ DEFAULT NULL,
    p_admin_id UUID DEFAULT auth.uid()
)
RETURNS VOID AS $$
DECLARE
    v_admin_role public.member_role;
    v_target_role public.member_role;
BEGIN
    SELECT role INTO v_admin_role
    FROM public.members
    WHERE user_id = p_admin_id
      AND conversation_id = p_conversation_id;

    IF v_admin_role NOT IN ('owner', 'admin') THEN
        RAISE EXCEPTION 'Only admins and owners can mute members';
    END IF;

    SELECT role INTO v_target_role
    FROM public.members
    WHERE user_id = p_target_user_id
      AND conversation_id = p_conversation_id;

    IF v_target_role = 'owner' THEN
        RAISE EXCEPTION 'Cannot mute the owner';
    END IF;

    IF v_target_role = 'admin' AND v_admin_role != 'owner' THEN
        RAISE EXCEPTION 'Only owners can mute admins';
    END IF;

    IF p_target_user_id = p_admin_id THEN
        RAISE EXCEPTION 'Cannot mute yourself';
    END IF;

    UPDATE public.members
    SET is_muted = true,
        muted_until = p_muted_until,
        muted_by = p_admin_id
    WHERE user_id = p_target_user_id
      AND conversation_id = p_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Unmute a member
-- =====================================================
CREATE OR REPLACE FUNCTION public.unmute_member(
    p_target_user_id UUID,
    p_conversation_id UUID,
    p_admin_id UUID DEFAULT auth.uid()
)
RETURNS VOID AS $$
DECLARE
    v_admin_role public.member_role;
BEGIN
    SELECT role INTO v_admin_role
    FROM public.members
    WHERE user_id = p_admin_id
      AND conversation_id = p_conversation_id;

    IF v_admin_role NOT IN ('owner', 'admin') THEN
        RAISE EXCEPTION 'Only admins and owners can unmute members';
    END IF;

    UPDATE public.members
    SET is_muted = false,
        muted_until = NULL,
        muted_by = NULL
    WHERE user_id = p_target_user_id
      AND conversation_id = p_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Create group conversation with owner
-- =====================================================
CREATE OR REPLACE FUNCTION public.create_group_conversation(
    p_name TEXT,
    p_creator_id UUID DEFAULT auth.uid()
)
RETURNS UUID AS $$
DECLARE
    v_conversation_id UUID;
BEGIN
    INSERT INTO public.conversations (type, name, creator_id)
    VALUES ('group', p_name, p_creator_id)
    RETURNING id INTO v_conversation_id;

    INSERT INTO public.members (user_id, conversation_id, role)
    VALUES (p_creator_id, v_conversation_id, 'owner');

    RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Create private conversation
-- =====================================================
CREATE OR REPLACE FUNCTION public.create_private_conversation(
    p_other_user_id UUID,
    p_current_user_id UUID DEFAULT auth.uid()
)
RETURNS UUID AS $$
DECLARE
    v_conversation_id UUID;
    v_existing_conversation_id UUID;
BEGIN
    SELECT c.id INTO v_existing_conversation_id
    FROM public.conversations c
    JOIN public.members m1 ON c.id = m1.conversation_id
    JOIN public.members m2 ON c.id = m2.conversation_id
    WHERE c.type = 'private'
      AND m1.user_id = p_current_user_id
      AND m2.user_id = p_other_user_id
    LIMIT 1;

    IF v_existing_conversation_id IS NOT NULL THEN
        RETURN v_existing_conversation_id;
    END IF;

    INSERT INTO public.conversations (type, name)
    VALUES ('private', NULL)
    RETURNING id INTO v_conversation_id;

    INSERT INTO public.members (user_id, conversation_id, role)
    VALUES
        (p_current_user_id, v_conversation_id, 'member'),
        (p_other_user_id, v_conversation_id, 'member');

    RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Update member role (admin/owner only)
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_member_role(
    p_target_user_id UUID,
    p_conversation_id UUID,
    p_new_role public.member_role,
    p_admin_id UUID DEFAULT auth.uid()
)
RETURNS VOID AS $$
DECLARE
    v_admin_role public.member_role;
BEGIN
    SELECT role INTO v_admin_role
    FROM public.members
    WHERE user_id = p_admin_id
      AND conversation_id = p_conversation_id;

    IF v_admin_role != 'owner' THEN
        RAISE EXCEPTION 'Only the owner can update member roles';
    END IF;

    IF p_target_user_id = p_admin_id THEN
        RAISE EXCEPTION 'Cannot update your own role';
    END IF;

    UPDATE public.members
    SET role = p_new_role
    WHERE user_id = p_target_user_id
      AND conversation_id = p_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Add friend (创建好友关系)
-- =====================================================
CREATE OR REPLACE FUNCTION public.add_friend(
    p_friend_id UUID,
    p_user_id UUID DEFAULT auth.uid()
)
RETURNS UUID AS $$
DECLARE
    v_friendship_id UUID;
BEGIN
    IF p_friend_id = p_user_id THEN
        RAISE EXCEPTION 'Cannot add yourself as a friend';
    END IF;

    INSERT INTO public.friendships (user_id, friend_id)
    VALUES (p_user_id, p_friend_id)
    RETURNING id INTO v_friendship_id;

    RETURN v_friendship_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Remove friend (删除好友关系)
-- =====================================================
CREATE OR REPLACE FUNCTION public.remove_friend(
    p_friend_id UUID,
    p_user_id UUID DEFAULT auth.uid()
)
RETURNS VOID AS $$
BEGIN
    DELETE FROM public.friendships
    WHERE user_id = p_user_id AND friend_id = p_friend_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Search users by name or id
-- =====================================================
CREATE OR REPLACE FUNCTION public.search_users(
    p_query TEXT,
    p_current_user_id UUID DEFAULT auth.uid(),
    p_limit INT DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    name VARCHAR(100),
    avatar_url TEXT,
    created_at TIMESTAMPTZ,
    is_friend BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.name,
        u.avatar_url,
        u.created_at,
        EXISTS (
            SELECT 1 FROM public.friendships f 
            WHERE f.user_id = p_current_user_id AND f.friend_id = u.id
        ) as is_friend
    FROM public.users u
    WHERE u.id != p_current_user_id
      AND (u.name ILIKE '%' || p_query || '%' OR u.id::text ILIKE '%' || p_query || '%')
    ORDER BY u.name
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGER: Auto-create user profile on auth user creation
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- Enable Realtime for messages table
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.members;
