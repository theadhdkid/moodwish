import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Rnd } from "react-rnd";
import { supabase } from "./lib/supabase";
import VisionBoardMoveable from "./components/VisionBoardMoveable";
import "./App.css";

type Board = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  visibility: "private" | "friends" | "public";
  background: string | null;
  view_mode: "list" | "collage" | "vision";
  created_at: string;
};

type WishlistItem = {
  id: string;
  board_id: string;
  user_id: string;
  title: string;
  url: string | null;
  image_url: string | null;
  price: string | null;
  notes: string | null;

  vision_x: number | null;
  vision_y: number | null;
  vision_width: number | null;
  vision_height: number | null;
  vision_rotation: number | null;
  vision_z_index: number | null;
  show_label: boolean | null;
  show_price: boolean | null;

  position: number | null;
  created_at: string;
};

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
  const [items, setItems] = useState<WishlistItem[]>([]);

  const [newBoardTitle, setNewBoardTitle] = useState("");
  const [newBoardDescription, setNewBoardDescription] = useState("");

const [newItemTitle, setNewItemTitle] = useState("");
const [newItemUrl, setNewItemUrl] = useState("");
const [newItemImageUrl, setNewItemImageUrl] = useState("");
const [newItemPrice, setNewItemPrice] = useState("");
const [newItemNotes, setNewItemNotes] = useState("");

const [editingItemId, setEditingItemId] = useState<string | null>(null);
const [editItemTitle, setEditItemTitle] = useState("");
const [editItemUrl, setEditItemUrl] = useState("");
const [editItemImageUrl, setEditItemImageUrl] = useState("");
const [editItemPrice, setEditItemPrice] = useState("");
const [editItemNotes, setEditItemNotes] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [boardsLoading, setBoardsLoading] = useState(false);
  const [itemsLoading, setItemsLoading] = useState(false);

  const [showMoveableExperiment, setShowMoveableExperiment] = useState(false);

  useEffect(() => {
    async function getInitialSession() {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        setMessage(error.message);
      } else {
        setUser(data.session?.user ?? null);
      }

      setLoading(false);
    }

    getInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user) {
      fetchBoards();
    } else {
      setBoards([]);
      setSelectedBoard(null);
      setItems([]);
    }
  }, [user]);

  useEffect(() => {
    if (selectedBoard) {
      fetchItems(selectedBoard.id);
    } else {
      setItems([]);
    }
  }, [selectedBoard]);

  async function fetchBoards() {
    setBoardsLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("boards")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
    } else {
      setBoards(data ?? []);
    }

    setBoardsLoading(false);
  }

  async function fetchItems(boardId: string) {
    setItemsLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("wishlist_items")
      .select("*")
      .eq("board_id", boardId)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
    } else {
      setItems(data ?? []);
    }

    setItemsLoading(false);
  }

  async function createBoard(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) return;

    setMessage("");
    setBoardsLoading(true);

    const { error } = await supabase.from("boards").insert({
      user_id: user.id,
      title: newBoardTitle,
      description: newBoardDescription || null,
      visibility: "private",
      view_mode: "list",
    });

    if (error) {
      setMessage(error.message);
    } else {
      setNewBoardTitle("");
      setNewBoardDescription("");
      await fetchBoards();
    }

    setBoardsLoading(false);
  }

  async function createItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user || !selectedBoard) return;

    const trimmedTitle = newItemTitle.trim();
    const trimmedUrl = newItemUrl.trim();
    const trimmedImageUrl = newItemImageUrl.trim();
    const trimmedPrice = newItemPrice.trim();
    const trimmedNotes = newItemNotes.trim();

    if (!trimmedTitle && !trimmedUrl) {
      setMessage("Add an item name or a link.");
      return;
    }

    setMessage("");
    setItemsLoading(true);

    let fetchedTitle: string | null = null;
    let fetchedImageUrl: string | null = null;
    let fetchedPrice: string | null = null;

    if (trimmedUrl) {
      const { data, error } = await supabase.functions.invoke("fetch-link-preview", {
        body: { url: trimmedUrl },
      });

      if (error && !trimmedTitle) {
        setItemsLoading(false);
        setMessage("Could not fetch this link. Add an item name manually or try another link.");
        return;
      }

      if (!error && data) {
        fetchedTitle = data.title ?? null;
        fetchedImageUrl = data.image_url ?? null;
        fetchedPrice = data.price ?? null;
      }
    }

    const { error } = await supabase.from("wishlist_items").insert({
      board_id: selectedBoard.id,
      user_id: user.id,
      title: trimmedTitle || fetchedTitle || "Untitled item",
      url: trimmedUrl || null,
      image_url: trimmedImageUrl || fetchedImageUrl,
      price: trimmedPrice || fetchedPrice || null,
      notes: trimmedNotes || null,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setNewItemTitle("");
      setNewItemUrl("");
      setNewItemPrice("");
      setNewItemNotes("");
      setNewItemImageUrl("");
      await fetchItems(selectedBoard.id);
    }

    setItemsLoading(false);
  }

  async function deleteItem(itemId: string) {
    if (!selectedBoard) return;

    const confirmDelete = window.confirm("Delete this item?");
    if (!confirmDelete) return;

    setMessage("");
    setItemsLoading(true);

    const { error } = await supabase
      .from("wishlist_items")
      .delete()
      .eq("id", itemId);

    if (error) {
      setMessage(error.message);
    } else {
      await fetchItems(selectedBoard.id);
    }

    setItemsLoading(false);
  }

  function startEditingItem(item: WishlistItem) {
  setEditingItemId(item.id);
  setEditItemTitle(item.title);
  setEditItemUrl(item.url ?? "");
  setEditItemImageUrl(item.image_url ?? "");
  setEditItemPrice(item.price ?? "");
  setEditItemNotes(item.notes ?? "");
  setMessage("");
}

function cancelEditingItem() {
  setEditingItemId(null);
  setEditItemTitle("");
  setEditItemUrl("");
  setEditItemImageUrl("");
  setEditItemPrice("");
  setEditItemNotes("");
}

async function saveEditedItem(itemId: string) {
  if (!selectedBoard) return;

  const trimmedTitle = editItemTitle.trim();

  if (!trimmedTitle) {
    setMessage("Item name cannot be empty.");
    return;
  }

  setMessage("");
  setItemsLoading(true);

  const { error } = await supabase
    .from("wishlist_items")
    .update({
      title: trimmedTitle,
      url: editItemUrl.trim() || null,
      image_url: editItemImageUrl.trim() || null,
      price: editItemPrice.trim() || null,
      notes: editItemNotes.trim() || null,
    })
    .eq("id", itemId);

  if (error) {
    setMessage(error.message);
  } else {
    cancelEditingItem();
    await fetchItems(selectedBoard.id);
  }

  setItemsLoading(false);
}

  async function deleteWishlist() {
    if (!selectedBoard) return;

    const boardId = selectedBoard.id;
    const boardTitle = selectedBoard.title;

    const confirmDelete = window.confirm(
      `Delete "${boardTitle}" and all its items?`
    );

    if (!confirmDelete) return;

    setMessage("");
    setBoardsLoading(true);

    const { error } = await supabase
      .from("boards")
      .delete()
      .eq("id", boardId);

    if (error) {
      setMessage(error.message);
    } else {
      setSelectedBoard(null);
      await fetchBoards();
    }

    setBoardsLoading(false);
  }

  async function updateWishlistViewMode(viewMode: "list" | "collage" | "vision") {
    if (!selectedBoard) return;

  setMessage("");

  const { error } = await supabase
    .from("boards")
    .update({ view_mode: viewMode })
    .eq("id", selectedBoard.id);

  if (error) {
    setMessage(error.message);
    return;
  }

  const updatedBoard = {
    ...selectedBoard,
    view_mode: viewMode,
  };

  setSelectedBoard(updatedBoard);
  setBoards((currentBoards) =>
    currentBoards.map((board) =>
      board.id === selectedBoard.id ? updatedBoard : board
    )
  );
}

async function updateItemVisionLayout(
  itemId: string,
  layout: {
    vision_x?: number;
    vision_y?: number;
    vision_width?: number;
    vision_height?: number;
    vision_z_index?: number;
  }
) {
  const { error } = await supabase
    .from("wishlist_items")
    .update(layout)
    .eq("id", itemId);

  if (error) {
    setMessage(error.message);
    return;
  }

  setItems((currentItems) =>
    currentItems.map((item) =>
      item.id === itemId
        ? {
            ...item,
            ...layout,
          }
        : item
    )
  );
}

  async function handleAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    if (authMode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
      } else {
        setMessage("Signup successful. Check your email if confirmation is enabled.");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
      } else {
        setMessage("");
      }
    }

    setLoading(false);
  }

  async function handleSignOut() {
    setLoading(true);

    const { error } = await supabase.auth.signOut();

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("");
      setUser(null);
      setSelectedBoard(null);
      setItems([]);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <main className="page">
        <p>Loading MOODWish...</p>
      </main>
    );
  }

  if (user && selectedBoard) {
    return (
      <main className="page dashboard-page">
        <section className="dashboard">
          <div className="dashboard-header">
            <div>
              <button className="text-button" onClick={() => setSelectedBoard(null)}>
                Back to wishlists
              </button>

              <p className="eyebrow">Wishlist</p>
              <h1>{selectedBoard.title}</h1>

              {selectedBoard.description && (
                <p className="muted">{selectedBoard.description}</p>
              )}


          <div
                    className="view-toggle">
                  <button
                    className={selectedBoard.view_mode === "list" ? "active" : ""}
                    onClick={() => updateWishlistViewMode("list")}
                  >
                    List
                  </button>

                  <button
                    className={selectedBoard.view_mode === "collage" ? "active" : ""}
                    onClick={() => updateWishlistViewMode("collage")}
                  >
                    Collage
                  </button>

                  <button
                    className={selectedBoard.view_mode === "vision" ? "active" : ""}
                    onClick={() => updateWishlistViewMode("vision")}
                  >
                    Vision
                  </button>
                </div>

                {selectedBoard.view_mode === "vision" && (
                  <button
                    className="text-button"
                    onClick={() => setShowMoveableExperiment(!showMoveableExperiment)}
                    style={{ marginTop: "1rem" }}
                  >
                    {showMoveableExperiment ? "Back to react-rnd" : "Try Moveable board"}
                  </button>
                )}
           </div>

            <div className="header-actions">
              <button className="subtle-button danger-button" onClick={deleteWishlist}>
                Delete wishlist
              </button>

              <button onClick={handleSignOut}>Sign out</button>
            </div>
          </div>

          <form onSubmit={createItem} className="board-form">
            <h2>Add an item</h2>

            <input
              type="text"
              placeholder="Item name"
              value={newItemTitle}
              onChange={(event) => setNewItemTitle(event.target.value)}
            />

            <input
              type="url"
              placeholder="Link, optional"
              value={newItemUrl}
              onChange={(event) => setNewItemUrl(event.target.value)}
            />

            <input
              type="url"
              placeholder="Image URL, optional"
              value={newItemImageUrl}
              onChange={(event) => setNewItemImageUrl(event.target.value)}
            />

            <input
              type="text"
              placeholder="Price, optional"
              value={newItemPrice}
              onChange={(event) => setNewItemPrice(event.target.value)}
            />

            <input
              type="text"
              placeholder="Notes, optional"
              value={newItemNotes}
              onChange={(event) => setNewItemNotes(event.target.value)}
            />

            <button type="submit" disabled={itemsLoading}>
              {itemsLoading ? "Saving..." : "Add item"}
            </button>
          </form>

          {message && <p className="message">{message}</p>}

          <section className="boards-section">
            <h2>Items</h2>

            {itemsLoading && <p className="muted">Loading items...</p>}

            {!itemsLoading && items.length === 0 && (
              <p className="muted">No items yet. Add your first item above.</p>
            )}

                    {selectedBoard.view_mode === "vision" ? (
       showMoveableExperiment ? (
  <VisionBoardMoveable
    items={items}
    onUpdateLayout={updateItemVisionLayout}
    onEdit={startEditingItem}
    onDelete={deleteItem}
  />
) : (
            <div className="vision-canvas">
              {items.map((item, index) => (
                <Rnd
                  key={item.id}
                  bounds="parent"
                  enableUserSelectHack={false}
                  default={{
                    x: item.vision_x ?? 40 + (index % 4) * 190,
                    y: item.vision_y ?? 40 + Math.floor(index / 4) * 190,
                    width: item.vision_width ?? 220,
                    height: item.vision_height ?? 220,
                  }}
                  scale={1}
                  minWidth={120}
                  minHeight={120}
                  onDragStop={(_event, data) => {
                    updateItemVisionLayout(item.id, {
                      vision_x: Math.round(data.x),
                      vision_y: Math.round(data.y),
                    });
                  }}
                  onResizeStop={(_event, _direction, ref, _delta, position) => {
                    updateItemVisionLayout(item.id, {
                      vision_width: Math.round(ref.offsetWidth),
                      vision_height: Math.round(ref.offsetHeight),
                      vision_x: Math.round(position.x),
                      vision_y: Math.round(position.y),
                    });
                  }}
                >
                  <div className="vision-free-item">
                    {item.url ? (
                      <a href={item.url} target="_blank" rel="noreferrer">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.title} />
                        ) : (
                          <div className="vision-placeholder">
                            {item.title.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                      </a>
                    ) : item.image_url ? (
                      <img src={item.image_url} alt={item.title} />
                    ) : (
                      <div className="vision-placeholder">
                        {item.title.slice(0, 1).toUpperCase()}
                      </div>
                    )}

                    {item.show_label !== false && (
                      <div className="vision-label">
                        <span>{item.title}</span>
                      </div>
                    )}

                    <div className="vision-controls">
                      <button onClick={() => startEditingItem(item)}>Edit</button>
                      <button onClick={() => deleteItem(item.id)}>Delete</button>
                    </div>
                  </div>
                </Rnd>
              ))}
            </div>
            )
          ) : (
            <div
              className={
                selectedBoard.view_mode === "collage"
                  ? "items-list collage-list"
                  : "items-list"
              }
            >
              {items.map((item) => (
                <article
                  key={item.id}
                  className={
                    selectedBoard.view_mode === "collage"
                      ? "item-card collage-card"
                      : "item-card"
                  }
                >
                  {editingItemId === item.id ? (
                    <div className="edit-item-form">
                      <input
                        type="text"
                        placeholder="Item name"
                        value={editItemTitle}
                        onChange={(event) => setEditItemTitle(event.target.value)}
                      />

                      <input
                        type="url"
                        placeholder="Link"
                        value={editItemUrl}
                        onChange={(event) => setEditItemUrl(event.target.value)}
                      />

                      <input
                        type="url"
                        placeholder="Image URL"
                        value={editItemImageUrl}
                        onChange={(event) => setEditItemImageUrl(event.target.value)}
                      />

                      <input
                        type="text"
                        placeholder="Price"
                        value={editItemPrice}
                        onChange={(event) => setEditItemPrice(event.target.value)}
                      />

                      <input
                        type="text"
                        placeholder="Notes"
                        value={editItemNotes}
                        onChange={(event) => setEditItemNotes(event.target.value)}
                      />

                      <div className="item-actions">
                        <button
                          className="subtle-button"
                          onClick={() => saveEditedItem(item.id)}
                          disabled={itemsLoading}
                        >
                          Save
                        </button>

                        <button className="subtle-button" onClick={cancelEditingItem}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {item.image_url ? (
                        <img className="item-image" src={item.image_url} alt={item.title} />
                      ) : (
                        <div className="item-image image-placeholder">
                          <span>{item.title.slice(0, 1).toUpperCase()}</span>
                        </div>
                      )}

                      <div className="item-content">
                        <div>
                          <h3>{item.title}</h3>

                          {item.price && <p className="item-price">{item.price}</p>}
                          {item.notes && <p>{item.notes}</p>}
                        </div>

                        <div className="item-footer">
                          {item.url && (
                            <a href={item.url} target="_blank" rel="noreferrer">
                              Open link
                            </a>
                          )}

                          <div className="item-actions">
                            <button className="icon-button" onClick={() => startEditingItem(item)}>
                              Edit
                            </button>

                            <button
                              className="icon-button danger-button"
                              onClick={() => deleteItem(item.id)}
                              aria-label={`Delete ${item.title}`}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </article>
              ))}
            </div>
          )}
          </section>
        </section>
      </main>
    );
  }

  if (user) {
    return (
      <main className="page dashboard-page">
        <section className="dashboard">
          <div className="dashboard-header">
            <div>
              <p className="eyebrow">Welcome back</p>
              <h1>MOODWish</h1>
              <p className="muted">Logged in as {user.email}</p>
            </div>

            <button onClick={handleSignOut}>Sign out</button>
          </div>

          <form onSubmit={createBoard} className="board-form">
            <h2>Create a wishlist</h2>

            <input
              type="text"
              placeholder="Wishlist title, e.g. Birthday wishlist"
              value={newBoardTitle}
              onChange={(event) => setNewBoardTitle(event.target.value)}
              required
            />

            <input
              type="text"
              placeholder="Description, optional"
              value={newBoardDescription}
              onChange={(event) => setNewBoardDescription(event.target.value)}
            />

            <button type="submit" disabled={boardsLoading}>
              {boardsLoading ? "Saving..." : "Create wishlist"}
            </button>
          </form>

          {message && <p className="message">{message}</p>}

          <section className="boards-section">
            <h2>Your wishlists</h2>

            {boardsLoading && <p className="muted">Loading wishlists...</p>}

            {!boardsLoading && boards.length === 0 && (
              <p className="muted">No wishlists yet. Create your first wishlist above.</p>
            )}

            <div className="boards-grid">
              {boards.map((board) => (
                <button
                  key={board.id}
                  className="board-card clickable-card"
                  onClick={() => setSelectedBoard(board)}
                >
                  <p className="board-visibility">{board.visibility}</p>
                  <h3>{board.title}</h3>

                  {board.description && <p>{board.description}</p>}

                  <p className="board-meta">View mode: {board.view_mode}</p>
                </button>
              ))}
            </div>
          </section>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="card">
        <p className="eyebrow">Mood-based wishlists</p>
        <h1>MOODWish</h1>
        <p className="muted">
          Save things you want, organize them into wishlists, and make gifting easier.
        </p>

        <div className="tabs">
          <button
            className={authMode === "signup" ? "active" : ""}
            onClick={() => {
              setAuthMode("signup");
              setMessage("");
            }}
          >
            Sign up
          </button>

          <button
            className={authMode === "login" ? "active" : ""}
            onClick={() => {
              setAuthMode("login");
              setMessage("");
            }}
          >
            Log in
          </button>
        </div>

        <form onSubmit={handleAuth} className="auth-form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={6}
          />

          <button type="submit">
            {authMode === "signup" ? "Create account" : "Log in"}
          </button>
        </form>

        {message && <p className="message">{message}</p>}
      </section>
    </main>
  );
}

export default App;