import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart")

    if(storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number): Promise<void> => {
    try {
      const product = (await api.get(`products/${productId}`)).data
      const stock = (await api.get(`stock/${productId}`)).data as Stock

      const addedProduct = cart.find(item => item.id === product.id)

      let updatedList: Product[] = []

      if(addedProduct){
        if(addedProduct.amount + 1 > stock.amount){
          toast.error('Quantidade solicitada fora de estoque')
          return
        }

        updatedList = cart.map(item => item.id === addedProduct.id ? ({
          ...item,
          amount: item.amount + 1
        }) : item )

      } else{        
        if(stock.amount <= 0){
          throw new Error('Quantidade solicitada fora de estoque');
        }

        updatedList = [...cart, {
          ...product,
          amount: 1
        }]
      }

      setCart(updatedList)
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedList))

    } catch(error: any) {
      toast.error('Erro na adição do produto')
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const product = cart.find(item => item.id === productId)

      if(!product){
        toast.error('Erro na remoção do produto');
        return
      }

      const updatedCart = cart.filter(item => item.id !== productId)
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedCart))
      setCart(updatedCart)

    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if(amount <= 0){ return }

      const stock = (await api.get(`stock/${productId}`)).data as Stock

      if(amount > stock.amount){
        toast.error('Quantidade solicitada fora de estoque')
        return
      }

      const productExists = cart.find(item => item.id === productId)

      if(productExists){
        const updatedCart = cart.map(item => item.id === productExists.id ? ({
          ...item,
          amount: amount
        }): item)
  
        setCart(updatedCart)
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedCart))
      } else{
        throw new Error()
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
